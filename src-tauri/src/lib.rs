#[tauri::command]
fn restart_app(app: tauri::AppHandle) {
  app.restart();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_autostart::Builder::new().build())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![restart_app])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
