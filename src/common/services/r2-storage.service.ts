import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2_CONFIG } from 'src/config/cloudflare-r2.config';

export interface ArchivoInfo {
  tamaño: number;
  tipoMime: string;
  ultimaModificacion: Date;
  etag: string;
}

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly s3Client: S3Client;

  constructor() {
    this.validateConfiguration();
    this.s3Client = this.createS3Client();
    this.logConfiguration();
  }

  /**
   * Valida que las credenciales de R2 estén configuradas
   */
  private validateConfiguration(): void {
    if (
      !R2_CONFIG.accountId ||
      !R2_CONFIG.accessKeyId ||
      !R2_CONFIG.secretAccessKey
    ) {
      throw new Error(
        'Credenciales de R2 no configuradas. Verifica las variables de entorno.',
      );
    }
  }

  /**
   * Crea y configura el cliente S3 para Cloudflare R2
   */
  private createS3Client(): S3Client {
    // Las credenciales ya fueron validadas en validateConfiguration()
    return new S3Client({
      region: R2_CONFIG.region,
      endpoint: R2_CONFIG.endpoint,
      credentials: {
        accessKeyId: R2_CONFIG.accessKeyId!,
        secretAccessKey: R2_CONFIG.secretAccessKey!,
      },
      requestHandler: {
        httpOptions: {
          timeout: 30000, // 30 segundos de timeout
          connectTimeout: 10000, // 10 segundos para conectar
        },
      },
      maxAttempts: 3, // Máximo 3 intentos
    });
  }

  /**
   * Registra la configuración en los logs (sin exponer credenciales)
   */
  private logConfiguration(): void {
    this.logger.log('Configurando R2 Storage Service...');
    this.logger.log(
      `Account ID: ${R2_CONFIG.accountId ? 'Configurado' : 'NO CONFIGURADO'}`,
    );
    this.logger.log(
      `Access Key ID: ${R2_CONFIG.accessKeyId ? 'Configurado' : 'NO CONFIGURADO'}`,
    );
    this.logger.log(
      `Secret Access Key: ${R2_CONFIG.secretAccessKey ? 'Configurado' : 'NO CONFIGURADO'}`,
    );
    this.logger.log(`Bucket Name: ${R2_CONFIG.bucketName}`);
    this.logger.log(`Endpoint: ${R2_CONFIG.endpoint}`);
    this.logger.log(`Ambiente: ${R2_CONFIG.ambiente}`);
  }

  /**
   * Construye la URL pública del archivo según el ambiente (método privado)
   */
  private buildPublicUrl(clave: string): string {
    const baseUrl =
      R2_CONFIG.ambiente === 'development'
        ? R2_CONFIG.developmentUrl
        : R2_CONFIG.productionUrl;

    if (!baseUrl) {
      this.logger.warn(
        `URL pública no configurada para ambiente ${R2_CONFIG.ambiente}, retornando clave`,
      );
      return clave;
    }

    return `${baseUrl}/${clave}`;
  }

  /**
   * Maneja errores de AWS SDK de forma consistente
   */
  private handleError(operation: string, clave: string, error: any): never {
    const errorDetails = {
      message: error.message,
      code: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      name: error.name,
    };

    this.logger.error(`Error en ${operation} para ${clave}:`, errorDetails);

    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      throw new NotFoundException(
        `Archivo no encontrado: ${clave}`,
      );
    }

    throw new BadRequestException(
      `Error al ${operation}: ${error.message}`,
    );
  }

  /**
   * Sube un archivo a R2 Storage
   * @param buffer Contenido del archivo
   * @param clave Ruta donde se guardará el archivo
   * @param tipoMime Tipo MIME del archivo
   * @param metadata Metadatos opcionales del archivo
   * @returns URL pública del archivo subido
   */
  async subirArchivo(
    buffer: Buffer,
    clave: string,
    tipoMime: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      this.logger.log(
        `Subiendo archivo: ${clave} (${buffer.length} bytes) al bucket: ${R2_CONFIG.bucketName}`,
      );

      const command = new PutObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: clave,
        Body: buffer,
        ContentType: tipoMime,
        Metadata: metadata,
      });

      await this.s3Client.send(command);
      this.logger.log(`Archivo subido exitosamente: ${clave}`);

      return this.buildPublicUrl(clave);
    } catch (error) {
      this.handleError('subir archivo', clave, error);
    }
  }

  /**
   * Obtiene un archivo desde R2 como Buffer
   * @param clave Ruta del archivo en R2
   * @returns Buffer con el contenido del archivo
   */
  async obtenerArchivo(clave: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: clave,
      });

      const response = await this.s3Client.send(command);

      // Convertir el stream a Buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;

      if (stream instanceof Buffer) {
        return stream;
      }

      if (!stream) {
        throw new Error('El archivo está vacío');
      }

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      this.logger.log(
        `Archivo descargado exitosamente: ${clave} (${buffer.length} bytes)`,
      );
      return buffer;
    } catch (error) {
      this.handleError('obtener archivo', clave, error);
    }
  }

  /**
   * Genera una URL firmada para descargar un archivo
   * @param clave Ruta del archivo
   * @param expiracionSegundos Tiempo de expiración en segundos (default: 1 hora)
   * @returns URL firmada temporal
   */
  async obtenerUrlDescarga(
    clave: string,
    expiracionSegundos = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: clave,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiracionSegundos,
      });

      this.logger.log(
        `URL de descarga generada para: ${clave} (expira en ${expiracionSegundos}s)`,
      );
      return url;
    } catch (error) {
      this.handleError('generar URL de descarga', clave, error);
    }
  }

  /**
   * Genera una URL firmada para subir un archivo directamente desde el cliente
   * @param clave Ruta donde se guardará el archivo
   * @param tipoMime Tipo MIME del archivo
   * @param expiracionSegundos Tiempo de expiración en segundos (default: 10 minutos)
   * @returns URL firmada para subida
   */
  async obtenerUrlSubida(
    clave: string,
    tipoMime: string,
    expiracionSegundos = 600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: clave,
        ContentType: tipoMime,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiracionSegundos,
      });

      this.logger.log(
        `URL de subida generada para: ${clave} (expira en ${expiracionSegundos}s)`,
      );
      return url;
    } catch (error) {
      this.handleError('generar URL de subida', clave, error);
    }
  }

  /**
   * Elimina un archivo de R2 Storage
   * @param clave Ruta del archivo a eliminar
   */
  async eliminarArchivo(clave: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: clave,
      });

      await this.s3Client.send(command);
      this.logger.log(`Archivo eliminado exitosamente: ${clave}`);
    } catch (error) {
      this.handleError('eliminar archivo', clave, error);
    }
  }

  /**
   * Verifica si un archivo existe en R2 Storage
   * @param clave Ruta del archivo
   * @returns true si existe, false si no existe
   */
  async archivoExiste(clave: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: clave,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }
      this.logger.error(
        `Error al verificar existencia de archivo ${clave}:`,
        error,
      );
      throw new BadRequestException(
        `Error al verificar existencia de archivo: ${error.message}`,
      );
    }
  }

  /**
   * Obtiene información detallada de un archivo
   * @param clave Ruta del archivo
   * @returns Información del archivo (tamaño, tipo MIME, fecha de modificación, etag)
   */
  async obtenerInformacionArchivo(clave: string): Promise<ArchivoInfo> {
    try {
      const command = new HeadObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: clave,
      });

      const response = await this.s3Client.send(command);
      return {
        tamaño: response.ContentLength || 0,
        tipoMime: response.ContentType || '',
        ultimaModificacion: response.LastModified || new Date(),
        etag: response.ETag?.replace(/"/g, '') || '',
      };
    } catch (error) {
      this.handleError('obtener información de archivo', clave, error);
    }
  }

  /**
   * Lista archivos en R2 Storage con un prefijo específico
   * @param prefijo Prefijo para filtrar archivos (ej: 'documentos/', 'certs/')
   * @param maxKeys Número máximo de archivos a retornar (default: 1000)
   * @returns Array de rutas de archivos encontrados
   */
  async listarArchivos(prefijo: string, maxKeys = 1000): Promise<string[]> {
    try {
      this.logger.log(`Listando archivos con prefijo: ${prefijo} en R2...`);

      const command = new ListObjectsV2Command({
        Bucket: R2_CONFIG.bucketName,
        Prefix: prefijo,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);

      const archivos: string[] = [];
      if (response.Contents && response.Contents.length > 0) {
        for (const object of response.Contents) {
          if (object.Key) {
            archivos.push(object.Key);
          }
        }
      }

      this.logger.log(
        `Se encontraron ${archivos.length} archivo(s) con prefijo ${prefijo}`,
      );
      return archivos;
    } catch (error) {
      this.logger.error(
        `Error al listar archivos con prefijo ${prefijo} en R2:`,
        error,
      );
      // Retornar array vacío en lugar de lanzar error para que la app pueda continuar
      return [];
    }
  }

  /**
   * Construye la URL pública de un archivo (método público para uso externo)
   * @param clave Ruta del archivo
   * @returns URL pública del archivo
   */
  construirUrlPublica(clave: string): string {
    return this.buildPublicUrl(clave);
  }

  /**
   * Obtiene el ambiente actual de la aplicación
   * @returns Ambiente actual ('development' o 'production')
   */
  obtenerAmbiente(): string {
    return R2_CONFIG.ambiente;
  }
}
