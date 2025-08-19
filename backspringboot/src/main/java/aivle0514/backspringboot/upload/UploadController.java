package aivle0514.backspringboot.upload;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private static final String APP_ROOT = "/app";
    private static final String PUBLIC_ROOT = APP_ROOT + "/public";

    @PostMapping(value = "/cat-image", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadCatImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId
    ) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "No file"));
        }

        // userId 정규화 (디렉터리 트래버설 방지용)
        String safeUserId = userId == null ? "unknown" : userId.replaceAll("[^\\w.-]", "_");

        // 간단 확장자/컨텐트타입 체크 (원하면 더 강화 가능)
        String original = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
        String lower = original.toLowerCase();
        boolean allowedExt = lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp");
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        boolean allowedMime = contentType.startsWith("image/");
        if (!allowedExt || !allowedMime) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Only image files (jpg, jpeg, png, webp) are allowed"));
        }

        try {
            // 사용자 하위 디렉토리 생성
            Path userDir = Paths.get(PUBLIC_ROOT, safeUserId).toAbsolutePath().normalize();
            Files.createDirectories(userDir);

            // 안전한 파일명 생성
            String baseName = original.contains(".")
                    ? original.substring(0, original.lastIndexOf('.'))
                    : original;
            String ext = original.contains(".")
                    ? original.substring(original.lastIndexOf('.'))
                    : "";
            String safeBase = baseName.replaceAll("[^\\w.-]", "_");
            String filename = System.currentTimeMillis() + "_" + safeBase + ext;

            // 저장
            Path target = userDir.resolve(filename).normalize();
            // 최종 경로가 userDir 바깥으로 벗어나지 않는지 확인 (이중 안전)
            if (!target.startsWith(userDir)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid path"));
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // DB 저장용 절대 경로 (예: /app/public/<userId>/<filename>.jpg)
            String savedPath = target.toString().replace("\\", "/");
            // 정적 서빙용 URL (예: /public/<userId>/<filename>.jpg)
            String publicUrl = savedPath.replace(APP_ROOT, "");

            Map<String, String> resp = new HashMap<>();
            resp.put("savedPath", savedPath);
            resp.put("publicUrl", publicUrl);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);

        } catch (IOException e) {
            // e.printStackTrace(); // 운영에서는 로거 사용 권장
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Upload failed"));
        }
    }
}
