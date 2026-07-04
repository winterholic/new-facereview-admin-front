import type {
  GetUsersResponse,
  GetVideosResponse,
  GetVideoRequestsResponse,
  GetCommentsResponse,
  SystemStatusResponse,
  BusinessStatsResponse,
  MessageResponse,
  Role,
  VideoRequestStatus,
} from 'types';
import api from './index';

// ---- Users ----

export const getUsers = (params: {
  keyword?: string;
  is_deleted?: boolean;
  page?: number;
  size?: number;
}) => api.get<GetUsersResponse>('/v2/admin/users', { params });

export const deactivateUser = (userId: string) =>
  api.patch<MessageResponse>(`/v2/admin/users/${userId}/deactivate`);

export const changeUserRole = (userId: string, role: Role) =>
  api.patch<MessageResponse>(`/v2/admin/users/${userId}/role`, { role });

// ---- Videos ----

export const getVideos = (params: {
  keyword?: string;
  category?: string;
  page?: number;
  size?: number;
}) => api.get<GetVideosResponse>('/v2/admin/videos', { params });

export const deleteVideo = (videoId: string) =>
  api.delete<MessageResponse>(`/v2/admin/videos/${videoId}`);

// ---- Video requests ----

export const getVideoRequests = (params: {
  status?: VideoRequestStatus;
  page?: number;
  size?: number;
}) => api.get<GetVideoRequestsResponse>('/v2/admin/video-requests', { params });

export const approveVideoRequest = (
  requestId: string,
  data: { youtube_title: string; channel_name: string; duration: number },
) =>
  api.post<{ video_id: string; message: string }>(
    `/v2/admin/video-requests/${requestId}/approve`,
    data,
  );

export const rejectVideoRequest = (requestId: string, adminComment: string) =>
  api.post<MessageResponse>(`/v2/admin/video-requests/${requestId}/reject`, {
    admin_comment: adminComment,
  });

// ---- Comments ----

export const getComments = (params: {
  video_id?: string;
  keyword?: string;
  is_deleted?: boolean;
  page?: number;
  size?: number;
}) => api.get<GetCommentsResponse>('/v2/admin/comments', { params });

export const deleteComment = (commentId: string) =>
  api.delete<MessageResponse>(`/v2/admin/comments/${commentId}`);

// ---- System status ----

export const getSystemStatus = () =>
  api.get<SystemStatusResponse>('/v2/admin/system/status');

// ---- Business stats ----

export const getBusinessStats = () =>
  api.get<BusinessStatsResponse>('/v2/admin/dashboard/business-stats');
