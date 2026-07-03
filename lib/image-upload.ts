export async function uploadResultImage(
  file: File,
  resultId: string,
): Promise<{ image_url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("resultId", resultId);

  const res = await fetch("/api/upload-result-image", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "上传失败");
  }

  return res.json();
}
