import { currentUser, login, logout, register, createResource, createGroup, createQuestion, createAnswer, createDiscussion, toggleSavedResource, joinGroup, voteQuestion, markNotificationsRead, updateProfile, updateProfilePicture, getProfile, respondToConversationRequest, searchLearners, sendChatMessage, startConversation, listReviews, saveReview, sendGroupMessage, listGroupMessages, startCall, listRingingCalls, getCall, respondToCall, markCallMissed, sendCallSignal as publishCallSignal, listCallSignals, clearCallSignals, listConversations, listConversationMessages } from './services/index.js';
import { appShell, escapeText } from './components/Navigation.js';
import { LandingPage } from './components/pages/LandingPage.js';
import { SignupPage } from './components/pages/SignupPage.js';
import { LoginPage } from './components/pages/LoginPage.js';
import { HomePage } from './components/pages/HomePage.js';
import { ResourcesPage } from './components/pages/ResourcesPage.js';
import { StudyGroupsPage } from './components/pages/StudyGroupsPage.js';
import { QuestionsPage } from './components/pages/QuestionsPage.js';
import { CommunityPage } from './components/pages/CommunityPage.js';
import { AILearningHubPage } from './components/pages/AILearningHubPage.js';
import { MessagesPage } from './components/pages/MessagesPage.js';
import { NotificationsPage } from './components/pages/NotificationsPage.js';
import { ProfilePage } from './components/pages/ProfilePage.js';
import { SettingsPage } from './components/pages/SettingsPage.js';
import { isSupabaseConfigured } from './services/supabaseConfig.js';

const protectedPages = new Set(['home', 'resources', 'groups', 'qa', 'community', 'ai', 'messages', 'notifications', 'profile', 'settings']);
const components = {
  home: HomePage,
  resources: ResourcesPage,
  groups: StudyGroupsPage,
  qa: QuestionsPage,
  community: CommunityPage,
  ai: AILearningHubPage,
  messages: MessagesPage,
  notifications: NotificationsPage,
  profile: ProfilePage,
  settings: SettingsPage
};
let user = currentUser();
let page = location.hash.slice(1) || 'home';
sessionStorage.removeItem('bright-path:confirmation-email');
let query = '';
let selectedConversationId = '';
let selectedGroupChatId = '';
let learnerSearch = '';
let learnerSearchResults = [];
let toastTimer;
let renderVersion = 0;
let activeCall = null;
let callMonitorTimer = null;
let callPollInProgress = false;
let callAudioContext = null;
const incomingRingtoneAudio = new Audio(new URL('./benkirb-ringtone-1-275863.mp3', import.meta.url));
incomingRingtoneAudio.loop = true;
incomingRingtoneAudio.volume = 0.8;
let ringbackTimer = null;
let chatRefreshTimer = null;
let lastChatRefreshError = '';
let lastCallMonitorError = '';

const callIcons = {
  microphone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5m-4 0h8"/></svg>',
  microphoneOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9v5.5a3 3 0 0 0 5.1 2.1M15 9V5.5a3 3 0 0 0-5.9-.7M5.5 11.5a6.5 6.5 0 0 0 11.1 4.6M12 18v3.5m-4 0h8M3 3l18 18"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>',
  cameraOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10 6h4a2 2 0 0 1 2 2v1l5-3v10l-3-1.8M7 6.5 5 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 1.2-.4"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/></svg>',
  speakerOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6"/></svg>',
  accept: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.8L7.7 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.7 2.7Z"/></svg>',
  hangup: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.8L7.7 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.7 2.7Z"/></svg>',
  decline: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 14 2.5-2.5a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.4 1l1.1 1.8a16 16 0 0 0 4-2.7l-1.3-1.3a2 2 0 0 1-.6-1.8l.5-2.8a2 2 0 0 1 2-1.7h3a2 2 0 0 1 2 2 19.8 19.8 0 0 1-3.1 8.6"/></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/></svg>'
};

function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function primeCallAudio() {
  if (typeof AudioContext === 'undefined') {
    if (activeCall?.phase !== 'incoming') callSoundUnavailable();
    return;
  }
  try {
    callAudioContext ||= new AudioContext();
  } catch (error) {
    console.warn('Call audio is unavailable in this browser.', error);
    callSoundUnavailable();
    return;
  }
  callAudioContext.resume().catch(() => {
    callSoundUnavailable();
  });
}

function callSoundUnavailable() {
  if (!activeCall) return;
  activeCall.isRingbackMuted = true;
  setCallStatus('Call sounds are off. Tap Sound on to enable them.');
  updateCallControl(document.querySelector('[data-call-action="ringtone"]'), 'speakerOff', 'Sound on', true);
}

function stopRingbackTone() {
  clearInterval(ringbackTimer);
  ringbackTimer = null;
  incomingRingtoneAudio.pause();
  incomingRingtoneAudio.currentTime = 0;
  if (callAudioContext?.state === 'running') callAudioContext.suspend();
}

function startRingbackTone() {
  stopRingbackTone();
  if (activeCall?.phase === 'incoming') {
    if (activeCall.isRingbackMuted) return;
    incomingRingtoneAudio.play().catch(callSoundUnavailable);
    return;
  }
  if (!callAudioContext) return;
  const ring = () => {
    if (!activeCall || !['incoming', 'outgoing'].includes(activeCall.phase) || activeCall.isRingbackMuted) return;
    const now = callAudioContext.currentTime;
    if (activeCall.phase === 'incoming') {
      for (const start of [now, now + 0.58]) {
        const duration = 0.38;
        const gain = callAudioContext.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.11, start + 0.035);
        gain.gain.setValueAtTime(0.11, start + duration * 0.72);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        gain.connect(callAudioContext.destination);
        for (const frequency of [440, 480]) {
          const oscillator = callAudioContext.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          oscillator.connect(gain);
          oscillator.start(start);
          oscillator.stop(start + duration + 0.02);
        }
        setTimeout(() => gain.disconnect(), (start - now + duration + 0.1) * 1000);
      }
      return;
    }
    const gain = callAudioContext.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.12);
    gain.gain.setValueAtTime(0.07, now + 1.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    gain.connect(callAudioContext.destination);
    for (const frequency of [440, 480]) {
      const oscillator = callAudioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(now);
      oscillator.stop(now + 1.42);
    }
    setTimeout(() => gain.disconnect(), 1500);
  };
  callAudioContext.resume().then(() => {
    ring();
    ringbackTimer = setInterval(ring, activeCall?.phase === 'incoming' ? 2800 : 4000);
  }).catch(callSoundUnavailable);
}

function callControl(action, icon, label, classes = '') {
  return `<button class="call-control ${classes}" type="button" data-call-action="${action}" aria-label="${label}" title="${label}"><span class="call-control-icon">${callIcons[icon]}</span><span class="call-control-label">${label}</span></button>`;
}

function showCallOverlay(call) {
  document.getElementById('call-overlay')?.remove();
  const incoming = call.phase === 'incoming';
  const title = incoming ? 'Incoming call' : call.phase === 'outgoing' ? 'Calling' : 'Call';
  const stateLabel = incoming ? 'Incoming call' : call.phase === 'outgoing' ? 'Ringing…' : 'Connecting…';
  const status = incoming
    ? `${escapeText(call.otherName || 'A learner')} is calling you`
    : call.phase === 'outgoing' ? `Waiting for ${escapeText(call.otherName || 'the learner')} to answer` : 'Connecting securely';
  const controls = incoming
    ? `${callControl('reject', 'hangup', 'Decline', 'call-control-end')}${callControl('ringtone', call.isRingbackMuted ? 'speakerOff' : 'speaker', call.isRingbackMuted ? 'Sound on' : 'Sound off')}${callControl('accept', 'accept', 'Answer', 'call-control-answer')}`
    : `${callControl('mute', 'microphone', 'Mute')}${call.isVideo ? callControl('camera', 'camera', 'Camera off') : ''}${callControl('speaker', 'speaker', 'Speaker')}${callControl('ringtone', 'speaker', call.isRingbackMuted ? 'Sound on' : 'Sound off')}${callControl('end', 'hangup', 'End call', 'call-control-end')}`;
  document.body.insertAdjacentHTML('beforeend', `<div class="call-overlay ${call.isVideo && !incoming ? 'call-overlay-video' : ''} ${incoming ? 'call-overlay-incoming' : ''}" id="call-overlay"><section class="call-window ${call.isVideo ? 'call-window-video' : 'call-window-audio'} ${incoming ? 'call-window-incoming' : ''}" role="dialog" aria-modal="true" aria-labelledby="call-title"><header class="call-window-head"><span class="call-type-pill">${callIcons[call.isVideo ? 'camera' : 'microphone']} ${incoming ? 'Incoming call' : call.isVideo ? 'Video call' : 'Audio call'}</span><button class="call-close" type="button" data-call-action="end" aria-label="${incoming ? 'Decline call' : 'End call'}">${callIcons.hangup}</button></header><div class="call-stage ${call.isVideo ? 'call-stage-video' : 'call-stage-audio'} ${incoming || call.phase === 'outgoing' ? 'is-ringing' : ''}"><video class="call-remote-video" id="remote-video" autoplay playsinline${call.isVideo ? '' : ' hidden'}></video><audio id="remote-audio" autoplay${call.isVideo ? ' hidden' : ''}></audio><video class="call-local-video" id="local-video" autoplay muted playsinline${call.isVideo && !incoming ? '' : ' hidden'}></video><div class="call-peer-card" ${call.isVideo && !incoming && call.remoteStream ? 'hidden' : ''}><div class="call-avatar-wrap"><div class="call-avatar">${escapeText((call.otherName || 'Learner')[0].toUpperCase())}</div><span class="call-avatar-pulse"></span></div><h1 id="call-title">${escapeText(call.otherName || 'Learner')}</h1><p class="call-status-line" id="call-status">${status}</p><span class="call-phase"><i></i><span id="call-phase-label">${stateLabel}</span></span></div><div class="call-video-topline"><span id="call-video-name">${escapeText(call.otherName || 'Learner')}</span><span id="call-video-status">${stateLabel}</span></div></div><footer class="call-window-foot"><div class="call-foot-copy"><strong>${escapeText(title)}</strong><span>${incoming ? `Incoming ${call.isVideo ? 'video' : 'audio'} call` : call.isVideo ? 'Stay connected face to face' : 'A private call with your learner'}</span></div><div class="call-controls">${controls}</div></footer></section></div>`);
  if (call.localStream && call.isVideo) {
    const localVideo = document.getElementById('local-video');
    localVideo.srcObject = call.localStream;
    localVideo.classList.toggle('is-camera-muted', !call.localStream.getVideoTracks()[0]?.enabled);
    localVideo.play().catch(error => {
      if (error.name === 'NotAllowedError') setCallStatus('Camera preview playback was blocked by your browser.');
      else notify(error.message || 'Could not play your camera preview.');
    });
  }
  if (call.remoteStream) {
    const media = call.isVideo ? document.getElementById('remote-video') : document.getElementById('remote-audio');
    media.srcObject = call.remoteStream;
    document.querySelector('.call-peer-card')?.setAttribute('hidden', '');
    document.querySelector('.call-stage')?.classList.remove('is-ringing');
  }
}

function setCallStatus(message) {
  const status = document.getElementById('call-status');
  if (status) status.textContent = message;
  const videoStatus = document.getElementById('call-video-status');
  if (videoStatus) videoStatus.textContent = message;
  const phase = document.getElementById('call-phase-label');
  if (phase) phase.textContent = message;
  document.getElementById('call-overlay')?.classList.toggle('call-is-connected', message === 'Connected');
}

function updateCallControl(button, icon, label, active = false) {
  if (!button) return;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.classList.toggle('is-active', active);
  const iconElement = button.querySelector('.call-control-icon');
  const labelElement = button.querySelector('.call-control-label');
  if (iconElement) iconElement.innerHTML = callIcons[icon];
  if (labelElement) labelElement.textContent = label;
}

function closeCallMedia() {
  if (!activeCall) return;
  stopRingbackTone();
  clearInterval(activeCall.pollTimer);
  activeCall.peer?.close();
  activeCall.localStream?.getTracks().forEach(track => track.stop());
  document.getElementById('call-overlay')?.remove();
  activeCall = null;
}

async function finishCall(updateRemote = true) {
  const call = activeCall;
  if (!call) return;
  try {
    if (call.phase === 'incoming') {
      await respondToCall(user.id, call.id, 'rejected');
    } else if (updateRemote) {
      await respondToCall(user.id, call.id, 'ended');
      await clearCallSignals(call.id);
    }
  } finally {
    closeCallMedia();
    if (page === 'messages') render(false);
  }
}

async function setupCallPeer(call) {
  call.peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  call.localStream.getTracks().forEach(track => call.peer.addTrack(track, call.localStream));
  call.peer.ontrack = event => {
    const remoteStream = call.remoteStream || new MediaStream();
    if (!remoteStream.getTracks().includes(event.track)) {
      remoteStream.addTrack(event.track);
    }
    call.remoteStream = remoteStream;
    const element = call.isVideo ? document.getElementById('remote-video') : document.getElementById('remote-audio');
    if (element) {
      if (element.srcObject !== remoteStream) {
        element.srcObject = remoteStream;
        element.play().catch(error => {
          if (error.name === 'NotAllowedError') {
            setCallStatus(call.isVideo ? 'Video playback was blocked by your browser.' : 'Audio playback was blocked by your browser.');
          } else {
            notify(error.message || 'Could not play the other learner call media.');
          }
        });
      }
    }
    const receivedCallMedia = call.isVideo
      ? remoteStream.getVideoTracks().length > 0
      : remoteStream.getAudioTracks().length > 0;
    if (receivedCallMedia) {
      document.querySelector('.call-peer-card')?.setAttribute('hidden', '');
      document.querySelector('.call-stage')?.classList.remove('is-ringing');
    }
  };
  call.peer.onicecandidate = event => {
    if (!event.candidate || activeCall !== call) return;
    publishCallSignal(user.id, call.id, call.otherUserId, 'ice-candidate', event.candidate.toJSON())
      .catch(error => notify(error.message || 'Could not exchange network details for the call.'));
  };
  call.peer.onconnectionstatechange = () => {
    if (call.peer.connectionState === 'connected') setCallStatus('Connected');
    if (call.peer.connectionState === 'failed') setCallStatus('Could not connect. A TURN relay may be required on this network.');
  };
}

async function beginMedia(call) {
  if (typeof RTCPeerConnection === 'undefined') {
    throw new Error('This browser does not support WebRTC calls.');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser cannot access a microphone or camera. Open Bright Path over HTTPS and allow device access.');
  }
  call.localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: call.isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
  });
  showCallOverlay(call);
}

async function processCallSignals(call) {
  const signals = await listCallSignals(user.id, call.id);
  for (const signal of signals) {
    if (call.seenSignals.has(signal.id)) continue;
    if (signal.event_type === 'offer' && call.phase === 'connecting') {
      if (!call.peer.remoteDescription) {
        await call.peer.setRemoteDescription(signal.payload);
        for (const candidate of call.pendingCandidates.splice(0)) await call.peer.addIceCandidate(candidate);
      }
      if (!call.answerSent) {
        if (!call.peer.localDescription) {
          const answer = await call.peer.createAnswer();
          await call.peer.setLocalDescription(answer);
        }
        await publishCallSignal(user.id, call.id, call.otherUserId, 'answer', call.peer.localDescription.toJSON());
        call.answerSent = true;
      }
    } else if (signal.event_type === 'answer' && call.phase === 'connecting' && !call.peer.remoteDescription) {
      await call.peer.setRemoteDescription(signal.payload);
      for (const candidate of call.pendingCandidates.splice(0)) await call.peer.addIceCandidate(candidate);
    } else if (signal.event_type === 'ice-candidate') {
      const candidate = new RTCIceCandidate(signal.payload);
      if (call.peer.remoteDescription) await call.peer.addIceCandidate(candidate);
      else call.pendingCandidates.push(candidate);
    }
    call.seenSignals.add(signal.id);
  }
}

async function pollActiveCall(call) {
  if (callPollInProgress || activeCall !== call) return;
  callPollInProgress = true;
  try {
    const session = await getCall(call.id);
    if (!session || ['ended', 'rejected', 'missed'].includes(session.status)) {
      closeCallMedia();
      notify(session?.status === 'rejected'
        ? 'The call was declined.'
        : session?.status === 'missed'
          ? call.callerId === user.id ? 'Call ended — no answer.' : 'You missed a call.'
          : 'The call ended.');
      if (page === 'messages') render(false);
      return;
    }
    if (call.phase === 'outgoing' && Date.now() - call.startedAt > 60000 && session.status === 'ringing') {
      const missed = await markCallMissed(user.id, call.id);
      if (missed) {
        closeCallMedia();
        notify('Call ended — no answer.');
        if (page === 'messages') render(false);
        return;
      }
    }
    if (call.phase === 'outgoing' && session.status === 'accepted') {
      stopRingbackTone();
      call.phase = 'connecting';
      await setupCallPeer(call);
    }
    if (call.phase === 'connecting' && call.callerId === user.id && !call.offerSent) {
      if (!call.peer) await setupCallPeer(call);
      if (!call.peer.localDescription) {
        const offer = await call.peer.createOffer();
        await call.peer.setLocalDescription(offer);
      }
      await publishCallSignal(user.id, call.id, call.otherUserId, 'offer', call.peer.localDescription.toJSON());
      call.offerSent = true;
      setCallStatus('Connecting…');
    }
    if (call.phase === 'connecting') await processCallSignals(call);
  } catch (error) {
    setCallStatus(error.message || 'The call connection failed.');
  } finally {
    callPollInProgress = false;
  }
}

function monitorCalls() {
  clearInterval(callMonitorTimer);
  if (!user || !isSupabaseConfigured) return;
  callMonitorTimer = setInterval(async () => {
    try {
      if (!user) return;
      const ringing = await listRingingCalls(user.id);
      const expired = ringing.filter(call => Date.now() - Date.parse(call.createdAt) > 60000);
      for (const call of expired) await markCallMissed(user.id, call.id);
      lastCallMonitorError = '';
      if (activeCall) {
        if (activeCall.phase !== 'incoming') return;
        const session = await getCall(activeCall.id);
        if (!session || ['ended', 'rejected', 'missed'].includes(session.status)) {
          const status = session?.status;
          closeCallMedia();
          notify(status === 'missed' ? 'You missed a call.' : 'The call ended.');
          if (page === 'messages') render(false);
        } else if (expired.some(call => call.id === activeCall.id)) {
          closeCallMedia();
          notify('You missed a call.');
          if (page === 'messages') render(false);
        }
        return;
      }
      const incoming = ringing.find(call => call.calleeId === user.id && Date.now() - Date.parse(call.createdAt) <= 60000);
      if (!incoming || activeCall) return;
      const conversations = await listConversations(user.id);
      const conversation = conversations.find(item => item.id === incoming.conversationId);
      if (!conversation || conversation.myStatus !== 'accepted') return;
      activeCall = {
        ...incoming,
        otherUserId: incoming.callerId,
        otherName: conversation.otherName,
        phase: 'incoming',
        isRingbackMuted: false,
        seenSignals: new Set(),
        offerSent: false,
        answerSent: false,
        pendingCandidates: []
      };
      primeCallAudio();
      showCallOverlay(activeCall);
      startRingbackTone();
    } catch (error) {
      const message = error.message || 'Could not check for incoming calls.';
      if (message !== lastCallMonitorError) notify(message);
      lastCallMonitorError = message;
    }
  }, 2000);
}

async function refreshActiveChat() {
  if (!user) return;
  const directThread = document.querySelector('.thread-body[data-latest-at]');
  const groupThread = document.querySelector('.group-chat-thread[data-group-id][data-latest-at]');
  if (!directThread && !groupThread) return;

  const append = (thread, messages, isGroup) => {
    if (!messages.length) return;
    const shouldScroll = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 48;
    thread.querySelector('.settings-hint')?.remove();
    for (const message of messages) {
      if (thread.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`)) continue;
      if (isGroup) {
        const article = document.createElement('article');
        article.className = `group-chat-message ${message.senderId === user.id ? 'mine' : ''}`;
        article.dataset.messageId = message.id;
        const name = document.createElement('strong');
        name.textContent = message.senderName || 'Learner';
        article.append(name);
        if (message.text) {
          const text = document.createElement('p');
          text.textContent = message.text;
          article.append(text);
        }
        if (message.imageUrl) {
          const image = document.createElement('img');
          image.src = message.imageUrl;
          image.alt = 'Picture shared in the study group';
          image.loading = 'lazy';
          article.append(image);
        }
        const time = document.createElement('time');
        time.textContent = new Date(message.createdAt).toLocaleString();
        article.append(time);
        thread.append(article);
      } else {
        const bubble = document.createElement('article');
        bubble.className = `bubble ${message.senderId === user.id ? 'mine' : ''}`;
        bubble.dataset.messageId = message.id;
        const text = document.createElement('p');
        text.textContent = message.text;
        const time = document.createElement('time');
        time.dateTime = message.createdAt;
        time.textContent = new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        bubble.append(text, time);
        thread.append(bubble);
      }
      thread.dataset.latestAt = message.createdAt;
    }
    if (shouldScroll) thread.scrollTop = thread.scrollHeight;
  };

  if (directThread && selectedConversationId) {
    append(directThread, await listConversationMessages(user.id, selectedConversationId, directThread.dataset.latestAt), false);
  }
  if (groupThread) {
    append(groupThread, await listGroupMessages(groupThread.dataset.groupId, groupThread.dataset.latestAt), true);
  }
}

function monitorChats() {
  clearInterval(chatRefreshTimer);
  if (!user) return;
  chatRefreshTimer = setInterval(async () => {
    try {
      await refreshActiveChat();
      lastChatRefreshError = '';
    } catch (error) {
      const message = error.message || 'Could not refresh the chat.';
      if (message !== lastChatRefreshError) notify(message);
      lastChatRefreshError = message;
    }
  }, 2500);
}

async function beginCall(targetUserId, isVideo) {
  if (activeCall) throw new Error('Finish the current call before starting another.');
  primeCallAudio();
  const call = {
    isVideo,
    otherUserId: targetUserId,
    otherName: (await listConversations(user.id)).find(item => item.id === selectedConversationId)?.otherName || 'Learner',
    phase: 'outgoing',
    isRingbackMuted: false,
    seenSignals: new Set(),
    pendingCandidates: []
  };
  activeCall = call;
  try {
    await beginMedia(call);
    const created = await startCall(user.id, selectedConversationId, targetUserId, isVideo);
    Object.assign(call, created);
    showCallOverlay(call);
    call.startedAt = Date.now();
    startRingbackTone();
    call.pollTimer = setInterval(() => pollActiveCall(call), 1200);
  } catch (error) {
    call.localStream?.getTracks().forEach(track => track.stop());
    document.getElementById('call-overlay')?.remove();
    if (activeCall === call) activeCall = null;
    throw error;
  }
}

async function acceptIncomingCall() {
  const call = activeCall;
  if (!call || call.phase !== 'incoming') return;
  stopRingbackTone();
  try {
    await beginMedia(call);
    await respondToCall(user.id, call.id, 'accepted');
    call.phase = 'connecting';
    await setupCallPeer(call);
    showCallOverlay(call);
    call.pollTimer = setInterval(() => pollActiveCall(call), 1200);
  } catch (error) {
    call.localStream?.getTracks().forEach(track => track.stop());
    if (call.phase === 'connecting') {
      try {
        await respondToCall(user.id, call.id, 'ended');
      } finally {
        closeCallMedia();
      }
    } else {
      call.localStream = null;
      call.phase = 'incoming';
      showCallOverlay(call);
      startRingbackTone();
    }
    throw error;
  }
}

function setSignupSelectOpen(select, open, focusOption = false) {
  const trigger = select.querySelector('[data-select-trigger]');
  const options = select.querySelector('[role="listbox"]');
  select.classList.toggle('is-open', open);
  trigger.setAttribute('aria-expanded', String(open));
  options.hidden = !open;
  if (open && focusOption) {
    const selected = options.querySelector('[aria-selected="true"]');
    (selected || options.firstElementChild)?.focus();
  }
}

function updatePasswordStrength(password) {
  const strength = document.querySelector('[data-password-strength]');
  const meter = strength?.querySelector('[role="meter"]');
  const label = strength?.querySelector('#password-strength-text');
  if (!strength || !meter || !label) return;
  if (!password) {
    strength.hidden = true;
    return;
  }
  const score = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
  const level = score <= 1 ? 1 : score <= 2 ? 2 : score <= 3 ? 3 : 4;
  const labelText = ['', 'Weak', 'Fair', 'Good', 'Strong'][level];
  strength.hidden = false;
  strength.dataset.strength = String(level);
  meter.setAttribute('aria-valuenow', String(level));
  meter.setAttribute('aria-valuetext', labelText);
  label.textContent = `Password strength: ${labelText}`;
}

function applyTheme(theme = 'system') {
  const useDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
}

function loadUserTheme(userId) {
  getProfile(userId)
    .then(profile => applyTheme(profile?.theme || 'system'))
    .catch(error => notify(error.message || 'Could not load your saved theme setting.'));
}

async function render(animate = true) {
  const thisRender = ++renderVersion;
  const root = document.getElementById('app');
  if (page === 'home' && !user) {
    root.innerHTML = LandingPage();
    return;
  }
  if (protectedPages.has(page) && !user) page = 'login';
  if (page === 'signup') root.innerHTML = SignupPage();
  else if (page === 'login') root.innerHTML = LoginPage();
  else if (protectedPages.has(page) && user) {
    const component = components[page];
    try {
      const content = page === 'messages'
        ? await component(user, selectedConversationId, learnerSearchResults, learnerSearch)
        : page === 'groups'
          ? await component(user, query, selectedGroupChatId)
          : await component(user, query);
      if (thisRender !== renderVersion) return;
      root.innerHTML = appShell(content, user, animate);
      if (page === 'messages') {
        const thread = root.querySelector('.messages-panel .thread-body');
        if (thread) thread.scrollTop = thread.scrollHeight;
      }
    } catch (error) {
      if (thisRender !== renderVersion) return;
      root.innerHTML = appShell(`<section class="panel"><h1>Couldn't load this page</h1><p>${escapeText(error.message || 'Check your connection and Supabase setup, then try again.')}</p><button class="btn btn-sm" data-action="retry">Try again</button></section>`, user, false);
    }
  } else root.innerHTML = LandingPage();
}

function navigate(nextPage) {
  const allowed = ['home', 'signup', 'login', 'confirm', ...protectedPages];
  page = allowed.includes(nextPage) ? nextPage : 'home';
  if (protectedPages.has(page) && !user && page !== 'home') {
    sessionStorage.setItem('bright-path:return-to', page);
    page = 'signup';
  }
  query = '';
  history.pushState(null, '', `#${page}`);
  render();
  window.scrollTo(0, 0);
}

async function showModal(kind) {
  if (kind === 'edit-profile') {
    const profile = await getProfile(user.id) || {};
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title"><div class="modal-head"><h2 id="profile-modal-title">Edit profile</h2><button class="modal-close" data-close-modal aria-label="Close">×</button></div><form id="profile-form"><label class="profile-photo-label" for="profile-photo">Profile picture</label><div class="profile-photo-picker"><div class="profile-photo-preview">${profile.avatarUrl ? `<img src="${escapeText(profile.avatarUrl)}" alt="Current profile picture">` : `<span aria-hidden="true">${escapeText(user.name[0] || '?')}</span>`}</div><div class="profile-photo-controls"><input class="profile-photo-input" id="profile-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a profile picture"><label class="profile-photo-button" for="profile-photo">Choose photo</label><span class="attachment-hint">JPG, PNG, or WebP · up to 5 MB</span></div></div><label for="profile-bio">About me</label><textarea class="field" id="profile-bio" name="bio" maxlength="500" placeholder="A little about your learning journey">${escapeText(profile.bio || '')}</textarea><label for="profile-interests">Learning interests</label><input class="field" id="profile-interests" name="interests" maxlength="200" placeholder="e.g. biology, design, history" value="${escapeText(profile.interests || '')}"><button class="btn" type="submit">Save profile</button></form></section></div>`);
    return;
  }
  const config = {
    resource: ['Share a resource', 'Resource title', 'Describe what other learners will find useful', 'Share Resource'],
    group: ['Create a study group', 'Group name', 'What will this group learn together?', 'Create Group'],
    question: ['Ask a question', 'Question title', 'Include details about what you have tried or where you are stuck', 'Post Question'],
    discussion: ['Start a discussion', 'Discussion title', 'Share your idea or question with the community', 'Post Discussion']
  }[kind];
  if (!config) return;
  const [title, titleLabel, detailPlaceholder, submitLabel] = config;
  const attachmentField = ['resource', 'discussion'].includes(kind)
    ? '<span class="attachment-field-label">Pictures or documents <span class="optional">(optional)</span></span><div class="attachment-picker"><input class="attachment-input" id="create-attachments" name="attachments" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/jpeg,image/png,image/webp,application/pdf" multiple aria-label="Choose pictures or documents to attach" aria-describedby="attachment-selection attachment-hint"><label class="attachment-picker-button" for="create-attachments"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3"/></svg><span>Choose files</span></label><span class="attachment-selection" id="attachment-selection" aria-live="polite">No files selected</span></div><span class="attachment-hint" id="attachment-hint">JPG, PNG, WebP, PDF, Word, PowerPoint, or Excel · up to 5 files, 15 MB each (25 MB total)</span>'
    : '';
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${title}</h2><button class="modal-close" data-close-modal aria-label="Close">×</button></div><form id="create-form" data-kind="${kind}"><label for="create-title">${titleLabel}</label><input class="field" id="create-title" name="title" required maxlength="140" placeholder="${titleLabel}">${kind === 'resource' || kind === 'question' ? `<label for="create-subject">Subject <span class="optional">(optional)</span></label><input class="field" id="create-subject" name="subject" maxlength="60" placeholder="e.g. Biology">` : ''}<label for="create-description">Details</label><textarea class="field" id="create-description" name="description" required maxlength="3000" placeholder="${detailPlaceholder}"></textarea>${kind === 'resource' ? '<label for="create-type">Resource type</label><select class="field" id="create-type" name="type"><option>Notes</option><option>Study guide</option><option>Article</option><option>Practice questions</option><option>Other</option></select>' : ''}${attachmentField}<button class="btn">${submitLabel}</button></form></section></div>`);
  document.getElementById('create-title').focus();
}

async function showReviewModal(targetType, targetId, targetName) {
  const reviews = await listReviews(targetType, targetId);
  const currentReview = reviews.find(review => (review.reviewer_id || review.reviewerId) === user.id);
  const rating = currentReview?.rating || 5;
  const comments = reviews.length
    ? reviews.map(review => `<article class="review-row"><strong>${escapeText(review.reviewer_name || review.reviewerName || 'Learner')} · ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</strong>${review.comment ? `<p>${escapeText(review.comment)}</p>` : ''}</article>`).join('')
    : '<p class="settings-hint">No reviews yet.</p>';
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal-backdrop"><section class="modal review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title"><div class="modal-head"><h2 id="review-modal-title">Reviews for ${escapeText(targetName)}</h2><button class="modal-close" data-close-modal aria-label="Close">×</button></div><div class="reviews-list">${comments}</div><form id="review-form" data-target-type="${escapeText(targetType)}" data-target-id="${escapeText(targetId)}" data-target-name="${escapeText(targetName)}"><label for="review-rating">Your rating</label><select class="field" id="review-rating" name="rating" required>${[5, 4, 3, 2, 1].map(value => `<option value="${value}"${value === rating ? ' selected' : ''}>${value} ${value === 1 ? 'star' : 'stars'}</option>`).join('')}</select><label for="review-comment">Comment <span class="optional">(optional)</span></label><textarea class="field" id="review-comment" name="comment" maxlength="1000" rows="3" placeholder="Share a helpful, respectful review">${escapeText(currentReview?.comment || '')}</textarea><button class="btn">Save review</button></form></section></div>`);
}

async function createContent(form) {
  const fields = new FormData(form);
  const common = {
    title: String(fields.get('title')).trim(),
    description: String(fields.get('description')).trim(),
    subject: String(fields.get('subject') || '').trim(),
    authorName: user.name,
    files: fields.getAll('attachments').filter(file => file instanceof File && file.size > 0)
  };
  const kind = form.dataset.kind;
  if (kind === 'resource') await createResource(user.id, { ...common, type: String(fields.get('type') || 'Notes'), level: user.level });
  if (kind === 'group') await createGroup(user.id, { ...common, name: common.title });
  if (kind === 'question') await createQuestion(user.id, common);
  if (kind === 'discussion') await createDiscussion(user.id, common);
  document.getElementById('modal-backdrop')?.remove();
  page = ({ resource: 'resources', group: 'groups', question: 'qa', discussion: 'community' })[kind];
  history.replaceState(null, '', `#${page}`);
  render();
  notify('Your contribution has been shared.');
}

async function preserveSearch(input) {
  query = input.value;
  const position = input.selectionStart;
  await render(false);
  const replacement = document.getElementById(input.id);
  replacement?.focus();
  replacement?.setSelectionRange(position, position);
}

document.addEventListener('click', async event => {
  const select = document.querySelector('[data-signup-select]');
  const target = event.target.closest('[data-page], [data-modal], [data-action], [data-save], [data-join], [data-vote], [data-close-modal], [data-select-trigger], [data-select-option], [data-toggle-password], [data-open-conversation], [data-start-conversation], [data-request-response], [data-review-type], [data-group-chat], [data-close-group-chat], [data-start-call], [data-call-action], [data-mobile-more]');
  if (user && target) primeCallAudio();
  if (select?.classList.contains('is-open') && !select.contains(event.target)) {
    setSignupSelectOpen(select, false);
  }
  const mobileIsland = document.querySelector('.mobile-island');
  const mobileMore = mobileIsland?.querySelector('[data-mobile-more]');
  if (mobileMore?.getAttribute('aria-expanded') === 'true' && !mobileIsland.contains(event.target)) {
    mobileMore.setAttribute('aria-expanded', 'false');
    document.getElementById('mobile-island-menu').hidden = true;
  }
  if (!target) return;
  try {
    if (target.hasAttribute('data-mobile-more')) {
      const menu = document.getElementById('mobile-island-menu');
      const expanded = target.getAttribute('aria-expanded') === 'true';
      target.setAttribute('aria-expanded', String(!expanded));
      menu.hidden = expanded;
    } else if (target.hasAttribute('data-toggle-password')) {
      const password = document.getElementById('password');
      const visible = password.type === 'password';
      password.type = visible ? 'text' : 'password';
      target.textContent = visible ? 'Hide' : 'Show';
      target.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
      target.setAttribute('aria-pressed', String(visible));
      password.focus();
    } else if (target.hasAttribute('data-select-trigger')) {
      const isOpen = target.getAttribute('aria-expanded') === 'true';
      setSignupSelectOpen(select, !isOpen, !isOpen);
    } else if (target.hasAttribute('data-select-option')) {
      const value = target.dataset.selectOption;
      select.querySelector('input[name="level"]').value = value;
      select.querySelector('#level-value').textContent = value;
      select.querySelectorAll('[data-select-option]').forEach(option => {
        option.setAttribute('aria-selected', String(option === target));
      });
      setSignupSelectOpen(select, false);
      select.querySelector('[data-select-trigger]').focus();
    } else if (target.dataset.action === 'edit-profile') {
      await showModal('edit-profile');
    } else if (target.dataset.startCall) {
      const conversation = (await listConversations(user.id)).find(item => item.id === selectedConversationId);
      if (!conversation || conversation.myStatus !== 'accepted' || conversation.otherStatus !== 'accepted') {
        throw new Error('Calls are only available for approved conversations.');
      }
      await beginCall(conversation.otherUserId, target.dataset.startCall === 'video');
    } else if (target.dataset.callAction === 'accept') await acceptIncomingCall();
    else if (target.dataset.callAction === 'reject') await finishCall(false);
    else if (target.dataset.callAction === 'end') await finishCall();
    else if (target.dataset.callAction === 'mute') {
      const track = activeCall?.localStream?.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        updateCallControl(target, track.enabled ? 'microphone' : 'microphoneOff', track.enabled ? 'Mute' : 'Unmute', !track.enabled);
      }
    } else if (target.dataset.callAction === 'camera') {
      const track = activeCall?.localStream?.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        updateCallControl(target, track.enabled ? 'camera' : 'cameraOff', track.enabled ? 'Camera off' : 'Camera on', !track.enabled);
        document.getElementById('local-video')?.classList.toggle('is-camera-muted', !track.enabled);
      }
    } else if (target.dataset.callAction === 'speaker') {
      const media = document.getElementById(activeCall?.isVideo ? 'remote-video' : 'remote-audio');
      if (media) {
        media.muted = !media.muted;
        updateCallControl(target, media.muted ? 'speakerOff' : 'speaker', media.muted ? 'Speaker off' : 'Speaker', media.muted);
      }
    } else if (target.dataset.callAction === 'ringtone') {
      if (!['incoming', 'outgoing'].includes(activeCall?.phase)) return;
      activeCall.isRingbackMuted = !activeCall.isRingbackMuted;
      if (activeCall.isRingbackMuted) stopRingbackTone();
      else startRingbackTone();
      updateCallControl(target, activeCall.isRingbackMuted ? 'speakerOff' : 'speaker',
        activeCall.isRingbackMuted ? 'Sound on' : 'Sound off', activeCall.isRingbackMuted);
    } else if (target.hasAttribute('data-group-chat')) {
      selectedGroupChatId = target.dataset.groupChat;
      page = 'groups';
      history.replaceState(null, '', '#groups');
      await render(false);
    } else if (target.hasAttribute('data-close-group-chat')) {
      selectedGroupChatId = '';
      await render(false);
    } else if (target.dataset.reviewType) {
      await showReviewModal(target.dataset.reviewType, target.dataset.reviewTarget, target.dataset.reviewName);
    } else if (target.dataset.openConversation) {
      selectedConversationId = target.dataset.openConversation;
      page = 'messages';
      history.replaceState(null, '', '#messages');
      await render(false);
    } else if (target.dataset.startConversation) {
      const conversation = await startConversation(user.id, target.dataset.startConversation);
      selectedConversationId = conversation.id;
      page = 'messages';
      history.replaceState(null, '', '#messages');
      await render(false);
      notify(conversation.recipientStatus === 'pending'
        ? 'Message request sent. You can chat after it is approved.'
        : 'Conversation opened.');
    } else if (target.dataset.requestResponse) {
      await respondToConversationRequest(user.id, target.dataset.conversationId, target.dataset.requestResponse === 'accept');
      selectedConversationId = target.dataset.conversationId;
      await render(false);
      notify(target.dataset.requestResponse === 'accept' ? 'Message request accepted.' : 'Message request declined.');
    } else if (target.dataset.page) {
      event.preventDefault();
      navigate(target.dataset.page);
    } else if (target.dataset.modal) await showModal(target.dataset.modal);
    else if (target.hasAttribute('data-close-modal')) document.getElementById('modal-backdrop')?.remove();
    else if (target.dataset.save) {
      const saved = await toggleSavedResource(user.id, target.dataset.save);
      await render(false);
      notify(saved ? 'Resource saved.' : 'Resource removed from saved items.');
    } else if (target.dataset.join) {
      await joinGroup(user.id, target.dataset.join);
      await render(false);
      notify('You joined the study group.');
    } else if (target.dataset.vote) {
      await voteQuestion(user.id, target.dataset.vote);
      await render(false);
    } else if (target.dataset.action === 'logout') {
      clearInterval(callMonitorTimer);
      clearInterval(chatRefreshTimer);
      if (activeCall) await finishCall();
      logout();
      user = null;
      page = 'home';
      history.replaceState(null, '', '#home');
      render();
      notify('You have logged out.');
    } else if (target.dataset.action === 'mark-read') {
      await markNotificationsRead(user.id);
      await render(false);
    } else if (target.dataset.action === 'retry') await render();
  } catch (error) {
    notify(error.message || 'The request failed. Check your connection and try again.');
  }
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (form.id === 'auth-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      const authResult = form.dataset.auth === 'signup'
        ? await register({ name: data.get('name'), email: data.get('email'), password: data.get('password'), level: data.get('level') })
        : await login({ email: data.get('email'), password: data.get('password') });
      user = authResult.user;
      loadUserTheme(user.id);
      monitorCalls();
      monitorChats();
      const requestedPage = sessionStorage.getItem('bright-path:return-to') || 'home';
      sessionStorage.removeItem('bright-path:return-to');
      page = requestedPage;
      history.replaceState(null, '', `#${page}`);
      render();
      notify(`Welcome to Bright Path, ${user.name}!`);
    } catch (error) {
      notify(error.message || 'We could not complete your account request.');
    }
  }
  if (form.id === 'learner-search-form') {
    event.preventDefault();
    learnerSearch = String(new FormData(form).get('search') || '').trim();
    try {
      learnerSearchResults = await searchLearners(learnerSearch);
      await render(false);
    } catch (error) {
      notify(error.message || 'Could not search learners.');
    }
  }
  if (form.id === 'create-form') {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"], button:not([type])');
    if (submitButton?.disabled) return;
    if (submitButton) submitButton.disabled = true;
    try { await createContent(form); }
    catch (error) { notify(error.message || 'Could not save your contribution.'); }
    finally { if (submitButton) submitButton.disabled = false; }
  }
  if (form.id === 'chat-message-form') {
    event.preventDefault();
    const text = String(new FormData(form).get('text')).trim();
    if (!text) return;
    try {
      await sendChatMessage(user.id, selectedConversationId, text);
      await render(false);
      notify('Message sent.');
    } catch (error) { notify(error.message || 'Could not send the message.'); }
  }
  if (form.id === 'group-message-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      await sendGroupMessage(user.id, form.dataset.groupId, {
        text: data.get('text'),
        image: data.get('image')?.size ? data.get('image') : null,
        senderName: user.name
      });
      await render(false);
      notify('Group message sent.');
    } catch (error) {
      notify(error.message || 'Could not send the group message.');
    }
  }
  if (form.matches('.question-answer-form')) {
    event.preventDefault();
    const body = String(new FormData(form).get('body') || '').trim();
    try {
      await createAnswer(user.id, form.dataset.questionId, { body, authorName: user.name });
      await render(false);
      notify('Your answer was posted.');
    } catch (error) {
      notify(error.message || 'Could not post your answer.');
    }
  }
  if (form.id === 'review-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      await saveReview(user.id, {
        targetType: form.dataset.targetType,
        targetId: form.dataset.targetId,
        reviewerName: user.name,
        rating: data.get('rating'),
        comment: data.get('comment')
      });
      document.getElementById('modal-backdrop')?.remove();
      await render(false);
      notify('Your review was saved.');
    } catch (error) {
      notify(error.message || 'Could not save your review.');
    }
  }
  if (form.id === 'profile-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      await updateProfile(user.id, { bio: data.get('bio'), interests: data.get('interests'), level: user.level });
      const photo = data.get('photo');
      if (photo instanceof File && photo.size > 0) await updateProfilePicture(user.id, photo);
      document.getElementById('modal-backdrop')?.remove();
      await render(false);
      notify('Profile updated.');
    } catch (error) { notify(error.message || 'Could not update your profile.'); }
  }
  if (form.id === 'settings-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      const settings = await updateProfile(user.id, {
        isPublic: data.get('isPublic') === 'on',
        theme: data.get('theme')
      });
      applyTheme(settings.theme);
      await render(false);
      notify('Settings saved.');
    } catch (error) {
      notify(error.message || 'Could not save your settings.');
    }
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'password') updatePasswordStrength(event.target.value);
  if (event.target.id === 'page-search' || event.target.id === 'global-search') preserveSearch(event.target);
});

document.addEventListener('change', event => {
  if (event.target.id === 'profile-photo') {
    const file = event.target.files?.[0];
    const preview = document.querySelector('.profile-photo-preview');
    if (!preview || !file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      event.target.value = '';
      notify('Choose a JPG, PNG, or WebP profile picture up to 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      preview.innerHTML = `<img src="${escapeText(String(reader.result))}" alt="Selected profile picture preview">`;
    }, { once: true });
    reader.readAsDataURL(file);
    return;
  }
  if (event.target.id !== 'create-attachments') return;
  const files = [...event.target.files];
  const selection = document.getElementById('attachment-selection');
  if (!selection) return;
  selection.textContent = files.length
    ? files.length <= 2
      ? files.map(file => file.name).join(', ')
      : `${files[0].name}, ${files[1].name} +${files.length - 2} more`
    : 'No files selected';
  selection.title = files.map(file => file.name).join('\n');
  selection.classList.toggle('has-files', files.length > 0);
});

document.addEventListener('keydown', event => {
  const select = document.querySelector('[data-signup-select]');
  if (select?.classList.contains('is-open')) {
    const options = [...select.querySelectorAll('[data-select-option]')];
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % options.length;
    else if (event.key === 'ArrowUp') nextIndex = currentIndex < 0 ? options.length - 1 : (currentIndex - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (event.key === 'Escape') {
      setSignupSelectOpen(select, false);
      select.querySelector('[data-select-trigger]').focus();
    } else if (event.key === 'Tab') setSignupSelectOpen(select, false);
    if (nextIndex !== currentIndex && nextIndex >= 0) {
      event.preventDefault();
      options[nextIndex].focus();
    }
  } else if (event.key === 'ArrowDown' && event.target.matches('[data-select-trigger]')) {
    event.preventDefault();
    setSignupSelectOpen(select, true, true);
  }
  if (event.key === 'Escape') document.getElementById('modal-backdrop')?.remove();
  if (event.key === 'Enter' && event.target.id === 'global-search') {
    query = event.target.value;
    if (page === 'home') navigate('resources');
    else render();
  }
});

window.addEventListener('hashchange', () => {
  page = location.hash.slice(1) || 'home';
  render();
});
window.addEventListener('popstate', () => {
  page = location.hash.slice(1) || 'home';
  render();
});
if (user) {
  loadUserTheme(user.id);
  monitorCalls();
  monitorChats();
}
render();
