package com.fitnessai.backend.utils;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

public class FileValidator {

    // Tamaño máximo permitido: 10 MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    // Tipos MIME permitidos
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public static void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de imagen no puede estar vacío");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("El archivo excede el tamaño máximo permitido de 10 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Formato no permitido. Solo se aceptan imágenes JPEG, PNG o WebP");
        }

        // Validación profunda mediante Magic Bytes (File Signature) para evitar archivos disfrazados
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[12];
            int bytesRead = is.read(header);
            if (bytesRead < 4 || !isImageSignature(header, bytesRead)) {
                throw new IllegalArgumentException("El contenido del archivo no corresponde a una imagen válida o está corrupto");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Error al inspeccionar el archivo: " + e.getMessage());
        }
    }

    private static boolean isImageSignature(byte[] header, int length) {
        // JPEG signature: FF D8 FF
        if (length >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return true;
        }

        // PNG signature: 89 50 4E 47 (0x89 'P' 'N' 'G')
        if (length >= 4 && (header[0] & 0xFF) == 0x89 && header[1] == 'P' && header[2] == 'N' && header[3] == 'G') {
            return true;
        }

        // WebP signature: 'RIFF' en bytes 0-3 y 'WEBP' en bytes 8-11
        if (length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
            return true;
        }

        return false;
    }
}
