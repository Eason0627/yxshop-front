import type { UploadUserFile } from 'element-plus'

export interface UploadFileItem {
  url?: string
  name?: string
  status?: 'success' | 'fail' | 'uploading'
  response?: {
    url?: string
    [key: string]: any
  }
}


/**
 * 将JSON字符串格式的图片URL数组转换为UploadUserFile数组
 * @param imageStr JSON字符串格式的图片URL数组，如 `["url1", "url2"]` 或已经是数组
 * @returns UploadUserFile数组
 */
export function parseImageStrToFileList(imageStr: string | string[]): UploadUserFile[] {
  try {
    // 处理空值情况
    if (!imageStr) return []
    
    let images: string[] = []
    
    // 处理不同类型输入
    if (Array.isArray(imageStr)) {
      images = imageStr
    } else if (typeof imageStr === 'string') {
      // 尝试解析JSON字符串
      images = JSON.parse(imageStr)
      
      // 确保解析结果是数组
      if (!Array.isArray(images)) {
        console.warn('parseImageStrToFileList: 解析结果不是数组', imageStr)
        return []
      }
    } else {
      console.warn('parseImageStrToFileList: 不支持的参数类型', typeof imageStr)
      return []
    }
    
    // 转换为UploadUserFile数组
    return images
      .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
      .map(url => ({
        url,
        name: url.substring(url.lastIndexOf('/') + 1),
        status: 'success' as const
      }))
  } catch (e) {
    console.error('解析图片URL失败:', e)
    return []
  }
}



/**
 * 将文件列表转换回JSON字符串格式
 * @param fileList el-upload的文件列表
 * @returns JSON字符串格式的URL数组
 */
/**
 * 将UploadUserFile数组转换为JSON字符串格式的URL数组
 * @param fileList UploadUserFile数组
 * @returns JSON字符串格式的URL数组
 */
export function convertFileListToStr(fileList: UploadUserFile[]): string {
  const urls = fileList
    .map(file => file.url)
    .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
  
  return JSON.stringify(urls)
}