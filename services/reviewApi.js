import { makeId, readStore, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteInsert, remoteSelect } from './supabaseClient.js';

const REVIEWS = 'reviews';

export async function listReviews(targetType, targetId) {
  if (!['profile', 'group'].includes(targetType)) throw new Error('Invalid review target.');
  if (isSupabaseConfigured) {
    return remoteSelect('reviews',
      `select=*&target_type=eq.${targetType}&target_id=eq.${encodeURIComponent(targetId)}&order=created_at.desc`);
  }
  return readStore(REVIEWS, []).filter(review => review.targetType === targetType && review.targetId === targetId);
}

export async function saveReview(userId, input) {
  const { targetType, targetId } = input;
  const rating = Number(input.rating);
  const comment = String(input.comment || '').trim();
  if (!['profile', 'group'].includes(targetType)) throw new Error('Invalid review target.');
  if (!targetId || (targetType === 'profile' && targetId === userId)) throw new Error('You cannot review your own profile.');
  if (targetType === 'group') {
    const group = readStore('groups', []).find(item => item.id === targetId);
    if (!isSupabaseConfigured && (!group || !group.memberIds?.includes(userId))) {
      throw new Error('Join the study group before reviewing it.');
    }
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Choose a rating from 1 to 5 stars.');
  if (comment.length > 1000) throw new Error('Review comments must be 1,000 characters or fewer.');
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('reviews', {
      target_type: targetType,
      target_id: targetId,
      reviewer_id: userId,
      reviewer_name: input.reviewerName,
      rating,
      comment
    }, {
      query: 'on_conflict=target_type,target_id,reviewer_id&select=*',
      upsert: true
    });
    return row;
  }
  const reviews = readStore(REVIEWS, []);
  const existing = reviews.find(review => review.targetType === targetType &&
    review.targetId === targetId && review.reviewerId === userId);
  const review = {
    id: existing?.id || makeId(),
    targetType,
    targetId,
    reviewerId: userId,
    reviewerName: input.reviewerName,
    rating,
    comment,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  writeStore(REVIEWS, [...reviews.filter(item => item.id !== review.id), review]);
  return review;
}
