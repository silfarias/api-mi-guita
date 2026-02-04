import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryUploadOptions {
  public_id?: string;
  folder?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    this.validateConfiguration();
    this.configureCloudinary();
  }

  /**
   * Valida que las credenciales de Cloudinary estén configuradas
   */
  private validateConfiguration(): void {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        'Credenciales de Cloudinary no configuradas. Verifica las variables de entorno.',
      );
    }
  }

  /**
   * Configura Cloudinary con las credenciales del entorno
   */
  private configureCloudinary(): void {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.logger.log('Cloudinary configurado correctamente');
  }

  /**
   * Sube una imagen a Cloudinary desde un buffer (archivo de Multer)
   * @param buffer Buffer del archivo a subir
   * @param publicId Ruta donde se almacenará la imagen en Cloudinary (ej: 'mi-guita/fotos-perfiles/imagen')
   * @param options Opciones adicionales para la subida
   * @returns URL segura de la imagen subida
   */
  async uploadImageFromBuffer(
    buffer: Buffer,
    publicId: string,
    options?: CloudinaryUploadOptions,
  ): Promise<string> {
    try {
      if (!buffer || buffer.length === 0) {
        throw new BadRequestException('El buffer de la imagen es requerido');
      }

      if (!publicId) {
        throw new BadRequestException('El public_id es requerido');
      }

      const uploadOptions: CloudinaryUploadOptions = {
        public_id: publicId,
        resource_type: 'image',
        ...options,
      };

      this.logger.log(`Subiendo imagen a Cloudinary con public_id: ${publicId}`);

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              this.logger.error(`Error al subir imagen a Cloudinary: ${error.message}`, error.stack);
              reject(
                new BadRequestException(
                  `Error al subir imagen: ${error.message || 'Error desconocido'}`,
                ),
              );
            } else if (!result) {
              reject(
                new BadRequestException('Error al subir imagen: No se recibió respuesta de Cloudinary'),
              );
            } else {
              this.logger.log(`Imagen subida exitosamente: ${result.public_id}`);
              resolve(result.secure_url);
            }
          },
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error al subir imagen a Cloudinary: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Error al subir imagen: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  /**
   * Sube una imagen a Cloudinary desde una URL
   * @param imageUrl URL de la imagen o ruta del archivo local
   * @param publicId Ruta donde se almacenará la imagen en Cloudinary (opcional)
   * @param options Opciones adicionales para la subida
   * @returns Resultado de la subida con información de la imagen
   */
  async uploadImage(
    imageUrl: string,
    publicId?: string,
    options?: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    try {
      if (!imageUrl) {
        throw new BadRequestException('La URL de la imagen es requerida');
      }

      const uploadOptions: CloudinaryUploadOptions = {
        public_id: publicId,
        resource_type: 'auto',
        ...options,
      };

      this.logger.log(
        `Subiendo imagen a Cloudinary: ${imageUrl}${publicId ? ` con public_id: ${publicId}` : ''}`,
      );

      const uploadResult = await cloudinary.uploader.upload(imageUrl, uploadOptions);

      this.logger.log(`Imagen subida exitosamente: ${uploadResult.public_id}`);

      return uploadResult as CloudinaryUploadResult;
    } catch (error) {
      this.logger.error(`Error al subir imagen a Cloudinary: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Error al subir imagen: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  /**
   * Genera una URL optimizada de la imagen
   * @param publicId ID público de la imagen en Cloudinary
   * @param options Opciones de transformación y optimización
   * @returns URL optimizada de la imagen
   */
  getOptimizedUrl(
    publicId: string,
    options?: {
      fetch_format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
      quality?: 'auto' | number;
      width?: number;
      height?: number;
      crop?: string;
      gravity?: string;
    },
  ): string {
    if (!publicId) {
      throw new BadRequestException('El public_id es requerido');
    }

    const transformOptions = {
      fetch_format: options?.fetch_format || 'auto',
      quality: options?.quality || 'auto',
      ...(options?.width && { width: options.width }),
      ...(options?.height && { height: options.height }),
      ...(options?.crop && { crop: options.crop }),
      ...(options?.gravity && { gravity: options.gravity }),
    };

    return cloudinary.url(publicId, transformOptions);
  }

  /**
   * Genera una URL con transformación automática (auto-crop a cuadrado)
   * @param publicId ID público de la imagen en Cloudinary
   * @param size Tamaño del cuadrado (ancho y alto)
   * @returns URL transformada de la imagen
   */
  getSquareCroppedUrl(publicId: string, size: number = 500): string {
    return this.getOptimizedUrl(publicId, {
      crop: 'auto',
      gravity: 'auto',
      width: size,
      height: size,
    });
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * @param cloudinaryUrl URL completa de Cloudinary
   * @returns public_id extraído de la URL
   */
  extractPublicIdFromUrl(cloudinaryUrl: string): string | null {
    try {
      if (!cloudinaryUrl) {
        return null;
      }

      // Las URLs de Cloudinary tienen el formato:
      // https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
      const urlPattern = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
      const match = cloudinaryUrl.match(urlPattern);

      if (match && match[1]) {
        // Remover la extensión del archivo si existe
        const publicId = match[1].replace(/\.[^.]+$/, '');
        return publicId;
      }

      return null;
    } catch (error) {
      this.logger.warn(`No se pudo extraer public_id de la URL: ${cloudinaryUrl}`);
      return null;
    }
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param publicId ID público de la imagen a eliminar (puede ser public_id o URL completa)
   * @returns Resultado de la eliminación
   */
  async deleteImage(publicIdOrUrl: string): Promise<any> {
    try {
      if (!publicIdOrUrl) {
        throw new BadRequestException('El public_id o URL es requerido');
      }

      // Si es una URL, extraer el public_id
      let publicId = publicIdOrUrl;
      if (publicIdOrUrl.startsWith('http')) {
        const extractedId = this.extractPublicIdFromUrl(publicIdOrUrl);
        if (!extractedId) {
          throw new BadRequestException('No se pudo extraer el public_id de la URL');
        }
        publicId = extractedId;
      }

      this.logger.log(`Eliminando imagen de Cloudinary: ${publicId}`);

      const result = await cloudinary.uploader.destroy(publicId);

      this.logger.log(`Imagen eliminada: ${publicId}`);

      return result;
    } catch (error) {
      this.logger.error(
        `Error al eliminar imagen de Cloudinary: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Error al eliminar imagen: ${error.message || 'Error desconocido'}`,
      );
    }
  }
}