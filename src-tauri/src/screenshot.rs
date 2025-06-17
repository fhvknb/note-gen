use tauri::{path::BaseDirectory, AppHandle, Manager};
use xcap::{Window};

#[derive(serde::Serialize, serde::Deserialize)]
#[derive(Clone)]
pub struct ScreenshotImage {
    name: String,
    path: String,
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    z: i32,
}

fn normalized(s: &str) -> String {
    s.replace(" ", "-")
    .replace("/", "-")
    .replace("\\", "-")
    .replace("*", "-")
    .replace("?", "-")
    .replace(":", "-")
    .replace("<", "-")
    .replace(">", "-")
    .replace("|", "-")
}

#[tauri::command]
pub fn screenshot(app: AppHandle) -> Result<Vec<ScreenshotImage>, String> {
    println!("开始截图函数");
    let windows = match Window::all() {
        Ok(windows) => {
            println!("成功获取窗口列表，窗口数量: {}", windows.len());
            windows
        },
        Err(e) => {
            let error_msg = format!("获取窗口列表失败: {:?}", e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    };

    let temp_screenshot_folder = match app.path().resolve("temp_screenshot", BaseDirectory::AppData) {
        Ok(path) => {
            println!("临时文件夹路径: {:?}", path);
            path
        },
        Err(e) => {
            let error_msg = format!("解析临时文件夹路径失败: {:?}", e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    };

    if std::fs::metadata(&temp_screenshot_folder).is_ok() {
        match std::fs::remove_dir_all(&temp_screenshot_folder) {
            Ok(_) => println!("成功删除旧的临时文件夹"),
            Err(e) => {
                let error_msg = format!("删除旧的临时文件夹失败: {:?}", e);
                println!("{}", error_msg);
                // Non-fatal, proceed if removal fails but directory creation might fail later
            }
        }
    }
    
    match std::fs::create_dir_all(&temp_screenshot_folder) { // Use create_dir_all for robustness
        Ok(_) => println!("成功创建新的临时文件夹"),
        Err(e) => {
            let error_msg = format!("创建新的临时文件夹失败: {:?}", e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    }

    let mut files: Vec<ScreenshotImage> =vec![];
    let mut topmost_window_candidate: Option<Window> = None;
    let mut max_z: i32 = i32::MIN; // Initialize with the smallest possible i32 value

    // Titles to filter out, including the app's own window title
    // Ensure "NoteGen" (or your app's actual main window title if different) is in this list
    let system_titles = vec!["Dock", "Menu Bar", "MenuBar", "Status", "Notification Center", "", "Desktop", "NoteGen"];

    for window in windows {
        let title = window.title().unwrap_or_default();
        let current_z = window.z().unwrap_or(0); // Default to 0 if z-order is unavailable

        // Skip minimized windows
        if let Ok(minimized) = window.is_minimized() {
            if minimized {
                println!("窗口 '{}' 已最小化，跳过", title);
                continue;
            }
        } else {
            println!("无法确定窗口 '{}' 是否最小化，假设未最小化", title);
        }

        let width = window.width().unwrap_or(0);
        let height = window.height().unwrap_or(0);

        // Filter based on title and size
        if system_titles.contains(&title.as_str()) || 
           title.is_empty() || // Also skip truly empty titles explicitly
           width < 150 || 
           height < 150 {
            println!("窗口 '{}' ({}x{}) 被过滤掉 (系统窗口、应用本身、标题为空或尺寸过小)，跳过", title, width, height);
            continue;
        }
        
        println!("候选窗口: '{}', Z: {}, 当前最高Z: {}", title, current_z, max_z);
        // Check if this window is on top of the current topmost candidate
        if current_z > max_z {
            println!("找到新的层级更高窗口: '{}' (Z: {})", title, current_z);
            max_z = current_z;
            topmost_window_candidate = Some(window);
        }
    }

    if let Some(window_to_capture) = topmost_window_candidate {
        let title = window_to_capture.title().unwrap_or_default();
        let width = window_to_capture.width().unwrap_or(0);
        let height = window_to_capture.height().unwrap_or(0);
        let x = window_to_capture.x().unwrap_or(0);
        let y = window_to_capture.y().unwrap_or(0);
        let z = window_to_capture.z().unwrap_or(0); // This is max_z

        println!("最终选择截图窗口: '{}', 尺寸: {}x{}, 位置: ({},{},{}), Z: {}", 
                 title, width, height, x, y, z, z);

        match window_to_capture.capture_image() {
            Ok(image) => {
                println!("成功捕获窗口 '{}' 图像", title);
                let path_str = format!(
                    "{}/topmost-window-{}.png",
                    temp_screenshot_folder.display(),
                    normalized(&title)
                );

                match image.save(&path_str) {
                    Ok(_) => {
                        println!("截图保存成功: {:?}", path_str);
                        files.push(ScreenshotImage {
                            name: title,
                            path: path_str,
                            width,
                            height,
                            x,
                            y,
                            z,
                        });
                    },
                    Err(e) => {
                        println!("截图保存失败 for window '{}': {:?}", title, e);
                        // Optionally, you could return an error here or just log it
                    }
                };
            },
            Err(e) => {
                println!("捕获窗口 '{}' 图像失败: {:?}", title, e);
                // Optionally, return an error
                // return Err(format!("捕获窗口 '{}' 图像失败: {:?}", title, e));
            }
        };
    } else {
        println!("没有找到合适的窗口进行截图");
    }
    
    println!("截图函数完成，共捕获 {} 个窗口", files.len());
    Ok(files)
}