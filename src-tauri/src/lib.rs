use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{
  image::Image,
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  Manager, WindowEvent,
};

#[tauri::command]
fn restart_app(app: tauri::AppHandle) {
  app.restart();
}

#[derive(Default)]
struct AppState {
  is_quitting: AtomicBool,
}

fn get_tray_icon() -> Option<Image<'static>> {
  #[cfg(target_os = "macos")]
  {
    return Image::from_bytes(include_bytes!("../icons/tray-mac-18.png")).ok();
  }

  #[cfg(target_os = "windows")]
  {
    return Image::from_bytes(include_bytes!("../icons/tray-win-16.png")).ok();
  }

  #[cfg(not(any(target_os = "macos", target_os = "windows")))]
  {
    None
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_autostart::Builder::new().build())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
        let is_quitting = window
          .app_handle()
          .state::<AppState>()
          .is_quitting
          .load(Ordering::Relaxed);
        if !is_quitting {
          api.prevent_close();
          let _ = window.hide();
        }
      }
    })
    .invoke_handler(tauri::generate_handler![restart_app])
    .setup(|app| {
      app.manage(AppState::default());

      let show_item = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
      let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
      let tray_menu = Menu::with_items(app, &[&show_item, &quit_item])?;
      let app_handle = app.handle().clone();
      let mut tray_builder = TrayIconBuilder::with_id("main-tray")
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id().as_ref() {
          "show" => {
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
          "quit" => {
            app.state::<AppState>().is_quitting.store(true, Ordering::Relaxed);
            app.exit(0);
          }
          _ => {}
        })
        .on_tray_icon_event(move |_tray, event| {
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } = event
          {
            if let Some(window) = app_handle.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
        });

      if let Some(icon) = get_tray_icon().or_else(|| app.default_window_icon().cloned()) {
        tray_builder = tray_builder.icon(icon);
      }

      tray_builder.build(app)?;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app, event| {
      #[cfg(target_os = "macos")]
      if let tauri::RunEvent::Reopen { .. } = event {
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
    });
}
