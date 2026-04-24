use std::{
    fs,
    fs::OpenOptions,
    io::ErrorKind,
    io::{Read, Write},
    net::{SocketAddr, TcpStream},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};

use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{path::BaseDirectory, AppHandle, Emitter, Manager};

// редактируются под проект
// ВАЖНО: путь должен совпадать с bundle.resources в tauri.conf.json
#[cfg_attr(debug_assertions, allow(dead_code))]
#[cfg(target_os = "windows")]
const BACKEND_RELATIVE_PATH: &str = "resources/publish/Backend.exe";
#[cfg_attr(debug_assertions, allow(dead_code))]
#[cfg(not(target_os = "windows"))]
const BACKEND_RELATIVE_PATH: &str = "resources/publish/Backend";
const BACKEND_URL: &str = "http://127.0.0.1:43517";
const GUARDANT_MISSING_EXIT_CODE: i32 = 21;
const GUARDANT_ERROR_PREFIX: &str = "GUARDANT_ERROR:";
use std::sync::RwLock;

static RUNTIME_BACKEND_URL: RwLock<Option<String>> = RwLock::new(None);

#[derive(Clone, Serialize)]
struct BackendStatusEvent {
    status: BackendStatus,
}

#[derive(Clone, Serialize)]
pub struct BackendStartupErrorEvent {
    code: String,
    message: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "snake_case")]
enum BackendStatus {
    Reviving,
    StoppedTooManyRestarts,
    Running,
    Stopped,
}

#[derive(Clone, Copy, Debug)]
pub struct BackendConfig {
    pub port_scan_start: u16,
    pub monitor_interval_secs: u64,
    pub max_restarts_per_minute: u32,
    pub restart_penalty_secs: u64,
}

impl Default for BackendConfig {
    fn default() -> Self {
        BackendConfig {
            port_scan_start: 43517,
            monitor_interval_secs: 5,
            max_restarts_per_minute: 6,
            restart_penalty_secs: 30,
        }
    }
}

/// Проверяет доступность порта с несколькими попытками, чтобы избежать ложных срабатываний
/// при временных задержках (GC паузы, загрузка и т.д.)
fn check_backend_health(port: u16, retries: u32, retry_delay_ms: u64) -> bool {
    for attempt in 1..=retries {
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        match TcpStream::connect_timeout(&addr, Duration::from_secs(2)) {
            Ok(_) => return true,
            Err(_) if attempt < retries => {
                thread::sleep(Duration::from_millis(retry_delay_ms));
            }
            Err(_) => {}
        }
    }
    false
}

#[cfg(unix)]
fn send_signal_to_group(pid: u32, signal: i32) -> Result<(), BackendError> {
    let pgid = -(pid as i32);
    let result = unsafe { libc::kill(pgid, signal) };
    if result == 0 {
        return Ok(());
    }

    let err = std::io::Error::last_os_error();
    if err.raw_os_error() == Some(libc::ESRCH) {
        return Ok(());
    }

    Err(BackendError::Io(err))
}

#[cfg_attr(target_os = "windows", allow(dead_code))]
fn wait_child_exit(child: &mut Child, timeout: Duration) -> Result<bool, BackendError> {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if child.try_wait().map_err(BackendError::from)?.is_some() {
            return Ok(true);
        }
        thread::sleep(Duration::from_millis(100));
    }

    Ok(child.try_wait().map_err(BackendError::from)?.is_some())
}

fn terminate_child(child: &mut Child) -> Result<(), BackendError> {
    if child.try_wait().map_err(BackendError::from)?.is_some() {
        return Ok(());
    }

    #[cfg(unix)]
    {
        let pid = child.id();
        let _ = send_signal_to_group(pid, libc::SIGTERM);
        if wait_child_exit(child, Duration::from_secs(3))? {
            return Ok(());
        }

        let _ = send_signal_to_group(pid, libc::SIGKILL);
        if wait_child_exit(child, Duration::from_secs(2))? {
            return Ok(());
        }
    }

    match child.kill() {
        Ok(_) => {}
        Err(err) if err.kind() == ErrorKind::InvalidInput => return Ok(()),
        Err(err) => return Err(BackendError::Io(err)),
    }
    let _ = child.wait();
    Ok(())
}

pub struct BackendState {
    process: Mutex<Option<Child>>,
    monitor_started: AtomicBool,
    shutdown_requested: Arc<AtomicBool>,
    config: BackendConfig,
}

impl Default for BackendState {
    fn default() -> Self {
        BackendState::new(BackendConfig::default())
    }
}

impl BackendState {
    pub fn new(config: BackendConfig) -> Self {
        BackendState {
            process: Mutex::new(None),
            monitor_started: AtomicBool::new(false),
            shutdown_requested: Arc::new(AtomicBool::new(false)),
            config,
        }
    }

    pub fn start(&self, app_handle: &AppHandle) -> Result<(), BackendError> {
        self.shutdown_requested.store(false, Ordering::Release);
        // Быстрая проверка: если уже запущен, ничего не делаем.
        {
            let mut guard = self.process.lock().map_err(|_| BackendError::Poisoned)?;
            if let Some(mut child) = guard.take() {
                match child.try_wait().map_err(BackendError::from) {
                    Ok(None) => {
                        // все еще работает — сохраняем и выходим досрочно
                        *guard = Some(child);
                        return Ok(());
                    }
                    Ok(Some(_)) => {
                        #[cfg(debug_assertions)]
                        eprintln!("предыдущий процесс бэкенда завершился — очищаем дескриптор");
                        drop(child);
                    }
                    Err(_) => {
                        // неизвестное состояние — пытаемся прибить, чтобы избежать зомби
                        #[cfg(debug_assertions)]
                        eprintln!(
                            "try_wait вернул ошибку — пытаемся прибить зависший процесс бэкенда"
                        );
                        let _ = terminate_child(&mut child);
                    }
                }
            }
        }

        // Запускаем процесс бэкенда отдельно, чтобы монитор мог вызывать его без создания второго монитора.
        self.start_process(app_handle)?;

        // Запускаем поток монитора один раз, чтобы избежать рекурсивного создания потоков при рестартах.
        self.spawn_monitor_once(app_handle);
        Ok(())
    }

    /// Запускает единственный поток монитора, если он ещё не запущен.
    /// Монитор перезапускает бэкенд, вызывая `start_process` напрямую, поэтому он никогда
    /// не вызывает `start()` и, следовательно, не порождает дополнительные потоки монитора.
    fn spawn_monitor_once(&self, app_handle: &AppHandle) {
        if self.monitor_started.swap(true, Ordering::SeqCst) {
            return;
        }

        let ah = app_handle.clone();
        let config = self.config;
        let shutdown = Arc::clone(&self.shutdown_requested);
        thread::spawn(move || {
            // Простая петля мониторинга с задержкой перед перезапуском, чтобы избежать быстрых циклов перезапуска.
            let mut restart_count: u32 = 0;
            let mut window_start = Instant::now();
            while !shutdown.load(Ordering::Relaxed) {
                thread::sleep(Duration::from_secs(config.monitor_interval_secs));
                if shutdown.load(Ordering::Relaxed) {
                    break;
                }
                // Быстрая проверка завершения через доступ к состоянию приложения.
                let state = ah.state::<BackendState>();
                // Проверяем, что процесс есть, жив и порт доступен.
                let need_restart = {
                    let mut guard = match state.process.lock() {
                        Ok(g) => g,
                        Err(_) => continue,
                    };

                    if let Some(child) = guard.as_mut() {
                        // Если дочерний процесс завершился, помечаем для перезапуска.
                        match child.try_wait() {
                            Ok(None) => {
                                // Всё ещё работает — проверяем порт с повторами, чтобы избежать ложных срабатываний.
                                let port = RUNTIME_BACKEND_URL
                                    .read()
                                    .map(|opt| {
                                        opt.as_ref().and_then(|s| {
                                            s.split(':').last().and_then(|p| p.parse::<u16>().ok())
                                        })
                                    })
                                    .unwrap_or(None)
                                    .unwrap_or(config.port_scan_start);
                                // 3 попытки с задержкой 1 секунда между ними
                                !check_backend_health(port, 3, 1000)
                            }
                            Ok(Some(_)) | Err(_) => true,
                        }
                    } else {
                        // если процесса нет - запуск
                        true
                    }
                };

                if need_restart {
                    // Простое ограничение скользящим окном: не более шести перезапусков в минуту.
                    let now = Instant::now();
                    if now.duration_since(window_start) > Duration::from_secs(60) {
                        window_start = now;
                        restart_count = 0;
                    }
                    restart_count = restart_count.saturating_add(1);

                    if restart_count > config.max_restarts_per_minute {
                        emit_backend_status(&ah, BackendStatus::StoppedTooManyRestarts);
                        // Делаем более долгую паузу перед следующей проверкой, чтобы не крутить CPU.
                        thread::sleep(Duration::from_secs(config.restart_penalty_secs));
                        continue;
                    }

                    emit_backend_status(&ah, BackendStatus::Reviving);
                    let _ = state.stop_process();
                    let _ = state.start_process(&ah);
                }
            }
        });
    }

    // Внутренний помощник: запускает процесс бэкенда, не трогая флаг монитора.
    fn start_process(&self, app_handle: &AppHandle) -> Result<(), BackendError> {
        // Serialize start attempts to avoid concurrent spawns and URL races.
        let mut proc_guard = self.process.lock().map_err(|_| BackendError::Poisoned)?;
        if let Some(child) = proc_guard.as_mut() {
            match child.try_wait().map_err(BackendError::from) {
                Ok(None) => return Ok(()),
                Ok(Some(_)) | Err(_) => {
                    *proc_guard = None;
                }
            }
        }

        let mut command = build_backend_command(app_handle)?;
        let working_dir = command
            .get_current_dir()
            .map(Path::to_path_buf)
            .ok_or(BackendError::InvalidExecutableLocation)?;
        let log_file = working_dir.join("Backend.log");

        println!("Запуск бэкенда в {:?}", working_dir);

        command
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .env("BACKEND_LOG", &log_file);

        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            unsafe {
                command.pre_exec(|| {
                    if libc::setsid() == -1 {
                        return Err(std::io::Error::last_os_error());
                    }
                    Ok(())
                });
            }
        }

        let chosen_url = BACKEND_URL.to_string();
        println!("выбран URL бэкенда: {}", chosen_url);
        command.env("ASPNETCORE_URLS", &chosen_url);
        command.env("BACKEND_URL", &chosen_url);
        // Явно отключаем профили запуска, чтобы launchSettings.json не перезаписал наш порт.
        command.env("DOTNET_LAUNCH_PROFILE", "");

        // При запуске через `dotnet run` (разработка) launchSettings.json может перезаписать переменные окружения.
        // Передаём URL явно приложению, чтобы Kestrel привязался к выбранному порту.
        #[cfg(debug_assertions)]
        {
            command.arg("--");
            command.arg("--urls");
            command.arg(&chosen_url);
        }

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            command.creation_flags(CREATE_NO_WINDOW);
        }

        #[cfg(debug_assertions)]
        command.env("ASPNETCORE_ENVIRONMENT", "Development");

        #[cfg(not(debug_assertions))]
        command.env("ASPNETCORE_ENVIRONMENT", "Production");

        let mut child = command.spawn().map_err(BackendError::from)?;

        if let Some(stdout) = child.stdout.take() {
            stream_to_log(stdout, log_file.clone());
        }

        if let Some(stderr) = child.stderr.take() {
            stream_to_log(stderr, log_file.clone());
        }

        wait_for_port(&chosen_url, &mut child, &log_file)?;
        emit_backend_status(app_handle, BackendStatus::Running);
        match RUNTIME_BACKEND_URL.write() {
            Ok(mut guard) => {
                *guard = Some(chosen_url.clone());
            }
            Err(poisoned) => {
                // recover from poisoned lock to avoid crashing the app
                let mut guard = poisoned.into_inner();
                *guard = Some(chosen_url.clone());
            }
        }
        emit_backend_url(app_handle, &chosen_url);
        *proc_guard = Some(child);
        Ok(())
    }

    // Останавливает только процесс бэкенда, не трогая флаг остановки монитора.
    fn stop_process(&self) -> Result<(), BackendError> {
        let mut guard = self.process.lock().map_err(|_| BackendError::Poisoned)?;
        if let Some(mut child) = guard.take() {
            if child.try_wait().map_err(BackendError::from)?.is_none() {
                terminate_child(&mut child)?;
            }
        }
        Ok(())
    }

    pub fn stop(&self) -> Result<(), BackendError> {
        self.shutdown_requested.store(true, Ordering::Release);
        self.stop_process()
    }
}

impl Drop for BackendState {
    fn drop(&mut self) {
        self.shutdown_requested.store(true, Ordering::Release);
        if let Ok(mut guard) = self.process.lock() {
            if let Some(mut child) = guard.take() {
                if child.try_wait().ok().flatten().is_none() {
                    let _ = terminate_child(&mut child);
                }
            }
        }
    }
}

#[cfg_attr(debug_assertions, allow(dead_code))]
#[derive(Debug)]
pub enum BackendError {
    ResourceNotFound,
    InvalidExecutableLocation,
    Poisoned,
    Io(std::io::Error),
    StartupTimeout,
    NoAvailablePort,
    GuardantKeyMissing(String),
    ExitedEarly(i32),
}

impl std::fmt::Display for BackendError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BackendError::ResourceNotFound => write!(
                f,
                "исполняемый файл бэкенда не найден в ресурсах приложения"
            ),
            BackendError::InvalidExecutableLocation => {
                write!(f, "исполняемый файл бэкенда находится в недопустимом месте (ожидается внутри папки ресурсов)")
            }
            BackendError::Poisoned => write!(f, "мьютекс бэкенда в отравленном состоянии"),
            BackendError::Io(err) => err.fmt(f),
            BackendError::StartupTimeout => {
                write!(f, "ошибка открытия порта {} бэкендом", BACKEND_URL)
            }
            BackendError::NoAvailablePort => write!(f, "нет доступных портов для запуска бэкенда"),
            BackendError::GuardantKeyMissing(message) => {
                write!(f, "{message}")
            }
            BackendError::ExitedEarly(code) => write!(f, "бэкенд завершился с кодом {code}"),
        }
    }
}

impl std::error::Error for BackendError {}

impl From<std::io::Error> for BackendError {
    fn from(value: std::io::Error) -> Self {
        BackendError::Io(value)
    }
}

#[cfg_attr(debug_assertions, allow(dead_code))]
fn resolve_backend_executable(app_handle: &AppHandle) -> Result<PathBuf, BackendError> {
    if let Ok(resolved_path) = app_handle
        .path()
        .resolve(BACKEND_RELATIVE_PATH, BaseDirectory::Resource)
    {
        if resolved_path.exists() {
            return Ok(resolved_path);
        }
    }

    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(BACKEND_RELATIVE_PATH);
    if dev_path.exists() {
        return Ok(dev_path);
    }

    Err(BackendError::ResourceNotFound)
}

fn build_backend_command(app_handle: &AppHandle) -> Result<Command, BackendError> {
    #[cfg(debug_assertions)]
    {
        let _ = app_handle;
        let backend_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../Backend");
        let backend_project = backend_dir.join("Backend.csproj");
        let mut command = Command::new("dotnet");
        command
            .arg("run")
            .arg("--no-launch-profile")
            .arg("--project")
            .arg(backend_project)
            .current_dir(backend_dir);
        return Ok(command);
    }

    #[cfg(not(debug_assertions))]
    {
        let executable = resolve_backend_executable(app_handle)?;
        let working_dir = executable
            .parent()
            .map(Path::to_path_buf)
            .ok_or(BackendError::InvalidExecutableLocation)?;
        let mut command = Command::new(executable);
        command.current_dir(working_dir);
        return Ok(command);
    }
}

pub fn ensure_backend_running(app_handle: &AppHandle) -> Result<(), BackendError> {
    let state = app_handle.state::<BackendState>();
    let result = state.start(app_handle);
    if let Err(err) = &result {
        let msg = err.to_string();
        let _ = app_handle.emit("Backend-error", msg.clone());
        emit_backend_startup_error(app_handle, err);
        #[cfg(debug_assertions)]
        eprintln!("ошибка запуска бэкенда: {}", msg);
    }
    result
}

pub fn ensure_backend_stopped(app_handle: &AppHandle) {
    let state = app_handle.state::<BackendState>();
    if state.stop().is_ok() {
        emit_backend_status(app_handle, BackendStatus::Stopped);
    }
}

#[tauri::command]
pub fn backend_url() -> String {
    RUNTIME_BACKEND_URL
        .read()
        .map(|guard| guard.clone().unwrap_or_else(|| BACKEND_URL.to_string()))
        .unwrap_or_else(|poisoned| {
            poisoned
                .into_inner()
                .clone()
                .unwrap_or_else(|| BACKEND_URL.to_string())
        })
}

fn stream_to_log<R: Read + Send + 'static>(mut reader: R, path: PathBuf) {
    thread::spawn(move || {
        let mut file = match OpenOptions::new().create(true).append(true).open(&path) {
            Ok(f) => f,
            Err(_err) => {
                #[cfg(debug_assertions)]
                eprintln!("не удалось открыть файл лога {:?}: {}", path, _err);
                return;
            }
        };

        let mut buffer = [0_u8; 4096];
        while let Ok(len) = reader.read(&mut buffer) {
            if len == 0 {
                break;
            }
            if file.write_all(&buffer[..len]).is_err() {
                break;
            }
        }
    });
}

fn wait_for_port(url: &str, child: &mut Child, log_file: &Path) -> Result<(), BackendError> {
    let parsed = url.split("//").nth(1).ok_or(BackendError::StartupTimeout)?;

    let mut parts = parsed.split(':');
    let host = parts.next().unwrap_or("127.0.0.1");
    let port = parts
        .next()
        .and_then(|p| p.parse::<u16>().ok())
        .ok_or(BackendError::StartupTimeout)?;

    let deadline = Instant::now() + Duration::from_secs(20);
    while Instant::now() < deadline {
        match TcpStream::connect((host, port)) {
            Ok(_) => return Ok(()),
            Err(_) => {
                if let Some(status) = child.try_wait().map_err(BackendError::from)? {
                    return Err(classify_backend_exit(status.code().unwrap_or(-1), log_file));
                }
                thread::sleep(Duration::from_millis(500));
            }
        }
    }

    let _ = terminate_child(child);
    Err(BackendError::StartupTimeout)
}

fn classify_backend_exit(code: i32, log_file: &Path) -> BackendError {
    if code == GUARDANT_MISSING_EXIT_CODE {
        let message = read_guardant_error_message(log_file)
        .unwrap_or_else(|| {
            "Ключ Guardant не найден или защита не пройдена. Необходимо вставить ключ и перезапустить приложение."
                .to_string()
        });
        return BackendError::GuardantKeyMissing(message);
    }

    BackendError::ExitedEarly(code)
}

fn read_guardant_error_message(log_file: &Path) -> Option<String> {
    for _ in 0..5 {
        if let Ok(contents) = fs::read_to_string(log_file) {
            if let Some(message) = contents.lines().rev().find_map(|line| {
                line.trim()
                    .strip_prefix(GUARDANT_ERROR_PREFIX)
                    .map(|value| value.trim().to_string())
                    .filter(|value| !value.is_empty())
            }) {
                return Some(message);
            }
        }

        thread::sleep(Duration::from_millis(100));
    }

    None
}

fn emit_backend_status(app_handle: &AppHandle, status: BackendStatus) {
    let _ = app_handle.emit("Backend-status", BackendStatusEvent { status });
}

fn emit_backend_url(app_handle: &AppHandle, url: &str) {
    let _ = app_handle.emit("Backend-url", url.to_string());
}

fn emit_backend_startup_error(app_handle: &AppHandle, err: &BackendError) {
    let code = match err {
        BackendError::GuardantKeyMissing(_) => "guardant_key_missing",
        _ => "backend_startup_failed",
    };

    let payload = BackendStartupErrorEvent {
        code: code.to_string(),
        message: err.to_string(),
    };

    let _ = app_handle.emit("Backend-startup-error", payload);
}
