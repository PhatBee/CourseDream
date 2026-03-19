Được. Cách tối ưu nhất là **không lưu URL phát cố định trong DB**, mà lưu **bucket + object key + access scope + version + trạng thái nghiệp vụ**; khi cần phát thì backend mới sinh ra URL phù hợp. Trong S3, **object key** là định danh duy nhất của file trong bucket, nên đây là trường nên dùng làm “đường dẫn chuẩn” trong DB. Với nội dung private, CloudFront hỗ trợ **signed URL/signed cookies** để cấp quyền truy cập có thời hạn. Ngoài ra, S3 mặc định không public cho bucket/object mới, và Block Public Access có thể chặn public access ở mức bucket/account. ([AWS Documentation][1])

## Mô hình mình khuyên bạn chốt

Tách hẳn 2 vùng asset:

* **Preview public**: học thử, trailer, intro miễn phí
* **Course private**: toàn bộ lesson trả phí / nội dung chính

Về hạ tầng, nên có 2 bucket hoặc ít nhất 2 prefix tách biệt. Nếu muốn vận hành gọn và an toàn hơn, mình khuyên **2 bucket**:

* `phatbee-video-public`
* `phatbee-video-private`

Lý do:

* public và private có policy khác nhau
* tránh cấu hình nhầm public cho video trả phí
* lifecycle, logging, CDN behavior dễ tách hơn

## Cấu trúc S3 tối ưu

### 1) Bucket public cho preview

```text
s3://phatbee-video-public/courses/{courseId}/published/{courseVersion}/lessons/{lessonId}/preview/{fileName}.mp4
```

Ví dụ:

```text
s3://phatbee-video-public/courses/123/published/2/lessons/11/preview/intro.mp4
```

### 2) Bucket private cho lesson thường

```text
s3://phatbee-video-private/courses/{courseId}/versions/{courseVersion}/lessons/{lessonId}/video/{assetId}.mp4
```

Ví dụ:

```text
s3://phatbee-video-private/courses/123/versions/2/lessons/11/video/888.mp4
```

### 3) Bucket private cho bản draft/chờ duyệt

```text
s3://phatbee-video-private/courses/{courseId}/drafts/{draftVersion}/lessons/{lessonId}/video/{assetId}.mp4
```

Ví dụ:

```text
s3://phatbee-video-private/courses/123/drafts/3/lessons/11/video/999.mp4
```

Cách đặt key theo `course / version / lesson / asset` giúp:

* không overwrite file live
* rollback dễ
* admin duyệt/publish theo version rõ ràng
* truy vết asset đơn giản
  S3 object key là phần định danh object, nên thiết kế key ổn định như vậy là cách đúng nhất. ([AWS Documentation][1])

---

# DB nên lưu như thế nào là chính xác nhất

## 1) Bảng `courses`

```sql
courses
-------
id
title
status                 -- draft | pending_review | changes_requested | published | unpublished | rejected | suspended
published_version_no   -- version live hiện tại, null nếu chưa publish
current_draft_version_no
visibility             -- public | private
created_at
updated_at
```

## 2) Bảng `course_versions`

```sql
course_versions
---------------
id
course_id
version_no
status                 -- draft | submitted | approved | rejected | archived
is_live
submitted_at
approved_at
rejected_at
review_note
created_by
created_at
updated_at
```

## 3) Bảng `lessons`

```sql
lessons
-------
id
course_id
course_version_id
title
sort_order
lesson_type            -- video | quiz | article
is_preview             -- 1 = học thử public, 0 = private
status                 -- draft | ready | archived
created_at
updated_at
```

## 4) Bảng `video_assets`

Đây là bảng quan trọng nhất.

```sql
video_assets
------------
id
lesson_id
course_id
course_version_id
storage_provider       -- aws_s3
bucket_name
object_key
cloudfront_path
region
access_scope           -- public | private
asset_role             -- preview | lesson_main | trailer | replacement
asset_status           -- uploading | uploaded | processing | ready | failed | archived
mime_type
filesize_bytes
duration_seconds
checksum_sha256
source_upload_name
created_by
created_at
updated_at
```

### Ý nghĩa các cột cần chốt

* `bucket_name`: `phatbee-video-public` hoặc `phatbee-video-private`
* `object_key`: key S3 chuẩn, đây là trường quan trọng nhất
* `cloudfront_path`: đường dẫn CDN logic, ví dụ `/courses/123/versions/2/lessons/11/video/888.mp4`
* `access_scope`:

  * `public` cho preview
  * `private` cho video trả phí
* `asset_role`:

  * `preview` cho video học thử
  * `lesson_main` cho video chính
* `course_version_id`: cực quan trọng để phân biệt live và draft

## 5) Bảng `lesson_progress`

```sql
lesson_progress
---------------
id
user_id
lesson_id
course_id
course_version_id
last_position_seconds
watched_seconds
completion_percent
is_completed
last_watched_at
updated_at
```

## 6) Bảng `review_feedback`

```sql
review_feedback
---------------
id
course_id
course_version_id
target_type            -- course | lesson | video_asset
target_id
severity               -- required | recommended
message
created_by_admin_id
created_at
resolved_at
```

---

# Cách lưu cho preview public và private video

## Preview public

Với lesson được học thử:

* `is_preview = 1`
* `video_assets.access_scope = 'public'`
* `bucket_name = 'phatbee-video-public'`
* `object_key` đi vào prefix `published/.../preview/...`

Ví dụ bản ghi:

```json
{
  "lesson_id": 11,
  "is_preview": 1,
  "bucket_name": "phatbee-video-public",
  "object_key": "courses/123/published/2/lessons/11/preview/intro.mp4",
  "cloudfront_path": "/courses/123/published/2/lessons/11/preview/intro.mp4",
  "access_scope": "public",
  "asset_role": "preview",
  "asset_status": "ready"
}
```

Frontend có thể dùng luôn:

```text
https://cdn-public.phatbee.dpdns.org/courses/123/published/2/lessons/11/preview/intro.mp4
```

## Private lesson video

Với lesson trả phí:

* `is_preview = 0`
* `video_assets.access_scope = 'private'`
* `bucket_name = 'phatbee-video-private'`
* backend sinh signed URL khi học viên bấm học

Ví dụ:

```json
{
  "lesson_id": 12,
  "is_preview": 0,
  "bucket_name": "phatbee-video-private",
  "object_key": "courses/123/versions/2/lessons/12/video/888.mp4",
  "cloudfront_path": "/courses/123/versions/2/lessons/12/video/888.mp4",
  "access_scope": "private",
  "asset_role": "lesson_main",
  "asset_status": "ready"
}
```

CloudFront signed URL phù hợp để bảo vệ private content; signed URL hợp với việc cấp quyền cho từng file cụ thể, còn signed cookies hợp hơn khi muốn cho phép truy cập nhiều file cùng lúc. ([AWS Documentation][2])

---

# Áp vào 8 trường hợp nghiệp vụ

## 1) Khóa học mới, chưa publish, đang draft

**S3**

* upload vào private draft path:

```text
courses/{courseId}/drafts/{draftVersion}/lessons/{lessonId}/video/{assetId}.mp4
```

**DB**

* `courses.status = 'draft'`
* `course_versions.status = 'draft'`
* `video_assets.access_scope = 'private'`
* `video_assets.asset_status = 'ready'` sau upload xong

**Lý do**

* chưa publish thì kể cả preview cũng chưa nên public thật

## 2) Khóa học mới, gửi duyệt lần đầu

**S3**

* không copy file
* giữ nguyên object key draft

**DB**

* `course_versions.status = 'submitted'`
* snapshot bằng `course_version_id`
* mọi lesson/video gắn với version đó

**Lý do**

* tiết kiệm PUT/storage; Free Tier S3 có giới hạn request, nên không nên copy object mỗi lần submit nếu không cần. ([Udemy Support][3])

## 3) Bị trả về sửa

**S3**

* nếu sửa text thì không đụng file
* nếu thay video, upload object mới vào cùng draft version hoặc draft version tăng mới

**DB**

* `courses.status = 'changes_requested'`
* asset cũ giữ nguyên
* asset mới tạo record mới trong `video_assets`

**Không nên**

* overwrite file cũ

## 4) Được duyệt và publish lần đầu

**S3**

* có 2 cách:

  * **Cách tối ưu storage**: giữ nguyên key draft/private, chỉ đổi bản live trong DB
  * **Cách rõ ràng hơn cho preview**: copy riêng **preview** sang bucket public/published path

Mình khuyên:

* **private lesson video**: không copy, chỉ đổi version live trong DB
* **preview public**: copy sang `public/published/...`

**DB**

* `courses.status = 'published'`
* `courses.published_version_no = 2`
* `course_versions.status = 'approved'`
* lesson preview trỏ asset public
* lesson thường trỏ asset private live

## 5) Khóa học đã publish, sửa nhẹ

Ví dụ sửa mô tả, quiz text, thumbnail.

**S3**

* thường không đổi video
* nếu đổi thumbnail/pdf, tạo asset mới là đủ

**DB**

* có thể update trực tiếp bản live
* không cần version mới nếu thật sự minor

## 6) Khóa học đã publish, sửa lớn

Ví dụ thay video, thêm lesson, đổi thứ tự curriculum.

**S3**

* upload video mới vào:

```text
courses/{courseId}/drafts/{newDraftVersion}/lessons/{lessonId}/video/{assetId}.mp4
```

**DB**

* tạo `course_version` mới, ví dụ version 3
* bản published version 2 vẫn phục vụ học viên
* chỉ khi admin approve mới đổi `published_version_no = 3`

Đây là case quan trọng nhất để tránh làm hỏng bản live.

## 7) Unpublish

Udemy cho phép unpublish course; course không còn hiện trên marketplace, nhưng học viên cũ vẫn có thể truy cập tùy chính sách. ([Udemy Support][4])

**S3**

* không di chuyển, không xóa

**DB**

* `courses.status = 'unpublished'`
* ngừng hiển thị marketplace
* quyền phát video vẫn dựa trên enrollment

## 8) Rejected / suspended

**S3**

* giữ nguyên file, có thể đánh `asset_status = 'archived'` hoặc `quarantined` ở app layer

**DB**

* `courses.status = 'rejected'` hoặc `suspended'`
* ngừng cấp signed URL cho private video
* preview public có thể tắt bằng cách bỏ mapping asset public

---

# Quy tắc chốt để DB luôn đúng

## Không lưu cố định các trường này

Không nên lưu vĩnh viễn:

* `signed_url`
* URL S3 presigned
* URL CloudFront signed

Vì signed URL có hạn dùng và chỉ nên sinh tại runtime. CloudFront private content được thiết kế để dùng signed URL/cookies khi truy cập. ([AWS Documentation][2])

## Nên lưu cố định

Nên lưu:

* `bucket_name`
* `object_key`
* `cloudfront_path`
* `access_scope`
* `course_version_id`
* `asset_role`
* `asset_status`

---

# Cách truy xuất khi học viên bấm vào bài học

## Với lesson preview

Backend kiểm tra `is_preview = 1`:

* trả URL public CDN ngay từ `cloudfront_path`
* không cần signed URL

## Với lesson private

Backend kiểm tra:

* course có published không
* user có quyền học không
* lesson thuộc published version nào
* asset `asset_status = ready` không

Sau đó:

* lấy `cloudfront_path`
* sinh signed URL cho file đó
* trả frontend phát bằng Video.js

---

# Thiết kế gọn nhất mình khuyên dùng

## Bucket

* `phatbee-video-public`
* `phatbee-video-private`

## CloudFront

* `cdn-public.phatbee.dpdns.org` → public bucket/prefix
* `cdn-private.phatbee.dpdns.org` → private bucket qua OAC + signed URL

## Prefix

```text
public:
courses/{courseId}/published/{version}/lessons/{lessonId}/preview/{file}.mp4

private live:
courses/{courseId}/versions/{version}/lessons/{lessonId}/video/{assetId}.mp4

private draft:
courses/{courseId}/drafts/{draftVersion}/lessons/{lessonId}/video/{assetId}.mp4
```

## DB tối thiểu bắt buộc

* `courses`
* `course_versions`
* `lessons`
* `video_assets`
* `lesson_progress`

---

# Kết luận

Cách tối ưu nhất cho bạn là:

* **Preview miễn phí**: lưu ở **public bucket/prefix**, chỉ dùng cho bản đã publish
* **Video bài học trả phí**: luôn ở **private bucket/prefix**
* **Draft/chờ duyệt**: luôn ở private
* **DB chỉ lưu `bucket_name + object_key + version + access_scope`**, không lưu link signed cố định
* **Major edit** luôn tạo `course_version` mới và asset mới
* **Không overwrite video live**
* **Publish/unpublish/review** do DB quyết định, không do S3 quyết định

Mẫu record chuẩn nhất cho 1 video trong DB là:

```json
{
  "course_id": 123,
  "course_version_id": 21,
  "lesson_id": 11,
  "bucket_name": "phatbee-video-private",
  "object_key": "courses/123/drafts/3/lessons/11/video/999.mp4",
  "cloudfront_path": "/courses/123/drafts/3/lessons/11/video/999.mp4",
  "access_scope": "private",
  "asset_role": "lesson_main",
  "asset_status": "ready"
}
```

và với preview public:

```json
{
  "course_id": 123,
  "course_version_id": 20,
  "lesson_id": 10,
  "bucket_name": "phatbee-video-public",
  "object_key": "courses/123/published/2/lessons/10/preview/intro.mp4",
  "cloudfront_path": "/courses/123/published/2/lessons/10/preview/intro.mp4",
  "access_scope": "public",
  "asset_role": "preview",
  "asset_status": "ready"
}
```


[1]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html?utm_source=chatgpt.com "Naming Amazon S3 objects - Amazon Simple Storage Service"
[2]: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-urls.html?utm_source=chatgpt.com "Use signed URLs - Amazon CloudFront - docs.aws.amazon.com"
[3]: https://support.udemy.com/hc/en-us/articles/229605348-Udemy-s-Quality-Review-Process?utm_source=chatgpt.com "Udemy's Quality Review Process"
[4]: https://support.udemy.com/hc/en-us/articles/229604968-Instructors-How-to-Delete-Unpublish-or-Republish-Your-Course?utm_source=chatgpt.com "Instructors: How to Delete, Unpublish or Republish Your Course - Udemy"
