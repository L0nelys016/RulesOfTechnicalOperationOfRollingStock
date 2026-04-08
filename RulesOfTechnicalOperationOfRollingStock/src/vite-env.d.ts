/// <reference types="vite/client" />
/// <reference types="vite/client" />

// Глобальные типы для импорта CSS и других ассетов
declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}