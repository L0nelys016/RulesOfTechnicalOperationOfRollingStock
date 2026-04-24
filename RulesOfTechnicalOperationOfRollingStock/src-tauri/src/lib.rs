mod backend;

use backend::{
    backend_url, ensure_backend_running, ensure_backend_stopped, BackendState,
};
use std::thread;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(BackendState::default())
        .setup(|app| {
            let handle = app.handle().clone();
            thread::spawn(move || {
                #[cfg(debug_assertions)]
                {
                    if let Err(err) = ensure_backend_running(&handle) {
                        eprintln!("Backend start failed: {}", err);
                    }
                    return;
                }

                #[cfg(not(debug_assertions))]
                match ensure_backend_running(&handle) {
                    Ok(_) => {}
                    Err(err) => {
                        eprintln!("Backend start failed: {}", err);
                    }
                }
            });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![backend_url])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                ensure_backend_stopped(&window.app_handle());
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if matches!(event, tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit) {
            ensure_backend_stopped(app_handle);
        }
    });
}
