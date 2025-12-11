# AI System Instructions Attachments Setup

## Status: ✅ IMPLEMENTED

File upload and attachment system is now fully functional for AI System Instructions.

---

## 🔧 Implementation Details

### 1. Supabase Storage Bucket Required

**Bucket Name:** `ai-instructions-media`

**Setup Steps:**
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `ai-instructions-media`
3. Set bucket to **Public** (or configure RLS policies)
4. Configure RLS policies if needed:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload their own files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'ai-instructions-media' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- Allow authenticated users to read their own files
   CREATE POLICY "Users can read their own files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'ai-instructions-media' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- Allow authenticated users to delete their own files
   CREATE POLICY "Users can delete their own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'ai-instructions-media' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

---

## 📁 File Structure

Files are organized in storage as:
```
ai-instructions-media/
  └── {userId}/
      ├── image/
      │   └── {timestamp}_{randomId}_{filename}
      ├── pdf/
      │   └── {timestamp}_{randomId}_{filename}
      ├── audio/
      │   └── {timestamp}_{randomId}_{filename}
      └── other/
          └── {timestamp}_{randomId}_{filename}
```

---

## 💾 Database Storage

Attachments are stored in `chatbot_settings.integrations` JSONB field:

```json
{
  "instructions_attachments": [
    {
      "id": "att_1234567890_abc123",
      "name": "product-image.png",
      "url": "https://...supabase.co/storage/v1/object/public/ai-instructions-media/...",
      "path": "userId/image/1234567890_abc123_product-image.png",
      "type": "image",
      "size": 245678,
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 🎯 Features

### ✅ Implemented
- Real Supabase Storage upload
- File type validation (images, PDFs, audio, video, documents)
- File size validation (25MB max)
- Attachment preview (images, PDFs, audio, video)
- Attachment deletion (removes from storage)
- Attachment persistence (saved with instructions)
- Attachment loading (restored when page loads)

### 📋 Supported File Types
- **Images:** PNG, JPG, JPEG, GIF, WebP
- **PDFs:** PDF
- **Audio:** MP3, WAV
- **Video:** MP4, WebM, MOV, AVI
- **Documents:** DOC, DOCX, TXT, RTF

---

## 🔌 Integration Points

### ChatbotSettingsPage.tsx
- Loads attachments from `chatbot_settings.integrations.instructions_attachments`
- Saves attachments when saving settings
- Passes attachments to `AiSystemInstructionsEditor`

### AiSystemInstructionsEditor.tsx
- Handles file upload UI
- Manages attachment state
- Calls `onAttachmentsChange` callback when attachments change
- Displays attachment thumbnails/previews
- Handles attachment deletion

### uploadMediaFile.ts
- Real Supabase Storage implementation
- File validation
- Upload to organized paths
- Returns public URLs
- Handles errors gracefully

---

## 🧪 Testing Checklist

- [ ] Create `ai-instructions-media` bucket in Supabase Storage
- [ ] Upload an image → Verify it appears in attachments panel
- [ ] Upload a PDF → Verify it appears with file icon
- [ ] Upload audio → Verify it appears with music icon
- [ ] Click preview on image → Verify modal opens
- [ ] Click preview on PDF → Verify iframe viewer opens
- [ ] Remove attachment → Verify it's deleted from storage
- [ ] Save settings → Verify attachments persist
- [ ] Reload page → Verify attachments are restored
- [ ] Try uploading file > 25MB → Verify error message
- [ ] Try uploading invalid file type → Verify error message

---

## 🚨 Error Handling

If bucket doesn't exist, user will see:
```
Storage bucket "ai-instructions-media" not found. 
Please create it in Supabase Storage settings.
```

If upload fails, user will see:
```
Failed to upload file to storage
```

If deletion fails, file is still removed from UI (logged as warning).

---

## 📝 Notes

- Attachments are stored separately from text (not embedded in instructions)
- Text editor remains plain text (no markdown/HTML)
- Attachments are organized by userId for security
- File paths include timestamp and random ID to prevent collisions
- Public URLs are used for preview/download

---

## 🔄 Future Enhancements

- [ ] Add drag-and-drop upload
- [ ] Add image gallery view
- [ ] Add file size compression for images
- [ ] Add progress bar for large uploads
- [ ] Add batch upload support
- [ ] Add attachment search/filter
- [ ] Add attachment categories/tags


