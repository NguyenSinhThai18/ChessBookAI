// src/services/uploadService.ts

export async function uploadImageToCloudinary(file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    }/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) throw new Error("Upload failed");

  return res.json(); // { secure_url, public_id, width, height }
}
