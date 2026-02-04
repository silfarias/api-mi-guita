import { Injectable, Logger } from '@nestjs/common';
// Sharp se carga de forma lazy para evitar crashes al iniciar el módulo


// Define opciones configurables para la optimización.
export interface ImageOptimizationOptions {
  maxWidth?: number;      // Ancho máximo (default: 1920px)
  maxHeight?: number;     // Alto máximo (default: 1080px)
  quality?: number;       // Calidad de compresión (default: 80%)
  format?: 'jpeg' | 'png' | 'webp' | 'jpg';  // Formato de salida
}

// Resultado de la optimización con métricas.
export interface OptimizedImageResult {
  buffer: Buffer;              // Imagen optimizada como Buffer
  originalSize: number;        // Tamaño original en bytes
  optimizedSize: number;       // Tamaño optimizado en bytes
  compressionRatio: number;    // Porcentaje de reducción
  width: number;               // Ancho final
  height: number;              // Alto final
  format: string;              // Formato final
}

@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);

  /**
   * Verifica si un archivo es una imagen
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Optimiza una imagen según los parámetros especificados
   */
  async optimizeImage(
    buffer: Buffer,
    mimeType: string,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizedImageResult> {
    if (!this.isImage(mimeType)) {
      throw new Error('El archivo no es una imagen');
    }

    const {
      maxWidth = 1920,    // Si no se especifica, usa 1920px
      maxHeight = 1080,   // Si no se especifica, usa 1080px
      quality = 80,       // Si no se especifica, usa 80% de calidad
      format = 'jpeg',     // Si no se especifica, convierte a JPEG
    } = options;

    const originalSize = buffer.length;
    this.logger.log(`Optimizando imagen: ${originalSize} bytes`);

    try {
      // Cargar sharp de forma lazy (solo cuando se necesita)
      const sharp = require('sharp');
      
      // Obtener información de la imagen original para obtener las dimensiones
      const imageInfo = await sharp(buffer).metadata();
      const originalWidth = imageInfo.width || 0;
      const originalHeight = imageInfo.height || 0;

      this.logger.log(
        `Dimensiones originales: ${originalWidth}x${originalHeight}`,
      );

      // Calcular nuevas dimensiones manteniendo aspect ratio
      const { width, height } = this.calculateDimensions(
        originalWidth,
        originalHeight,
        maxWidth,
        maxHeight,
      );

      // Optimizar la imagen
      let optimizedBuffer: Buffer;

      if (format === 'webp') {
        optimizedBuffer = await sharp(buffer)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality })
          .toBuffer();
      } else if (format === 'png') {
        optimizedBuffer = await sharp(buffer)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .png({ quality })
          .toBuffer();
      } else {
        optimizedBuffer = await sharp(buffer)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality })
          .toBuffer();
      }

      const optimizedSize = optimizedBuffer.length;
      const compressionRatio =
        ((originalSize - optimizedSize) / originalSize) * 100;

      this.logger.log(
        `Optimización completada: ${originalSize} → ${optimizedSize} bytes (${compressionRatio.toFixed(1)}% reducción)`,
      );

      return {
        buffer: optimizedBuffer,
        originalSize,
        optimizedSize,
        compressionRatio,
        width,
        height,
        format,
      };
    } catch (error) {
      this.logger.error(`Error al optimizar imagen: ${error.message}`);
      throw new Error(`Error al optimizar imagen: ${error.message}`);
    }
  }

  /**
   * Calcula las nuevas dimensiones manteniendo el aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Reducir ancho si es necesario
    if (width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    }

    // Reducir alto si es necesario
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }

    return { width, height };
  }

  /**
   * Genera una miniatura de la imagen
   */
  async generateThumbnail(
    buffer: Buffer,
    width: number = 300,
    height: number = 300,
  ): Promise<Buffer> {
    // Cargar sharp de forma lazy (solo cuando se necesita)
    const sharp = require('sharp');
    
    return sharp(buffer)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
  }

  /**
   * Verifica si una imagen necesita optimización
   */
  shouldOptimize(originalSize: number, maxSize: number = 1024 * 1024): boolean {
    return originalSize > maxSize; // 1MB por defecto
  }
}