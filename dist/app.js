const pathways = [
  {
    name: 'Academic Excellence Pathway',
    keywords: ['academic support', 'schoolwork', 'school grades', 'study skills', 'academic goals'],
    overview: 'Explore the Academic Excellence Pathway if you’re working on your schoolwork, study habits, or academic goals.',
  },
  {
    name: 'Language Proficiency Pathway',
    keywords: ['english', 'language learning', 'learn a language', 'language skills'],
    overview: 'Explore the Language Proficiency Pathway if you want to improve your English. You can tell us which skill you’d like to work on, such as speaking, reading, or writing.',
  },
  {
    name: 'Global Education Pathway',
    keywords: ['study abroad', 'studying abroad', 'international education', 'overseas study'],
    overview: 'The Global Education Pathway is a starting point for exploring education options abroad. Tell us which destinations or study goals you have in mind.',
  },
  {
    name: 'Communication & Leadership Pathway',
    keywords: ['public speaking', 'presentation skills', 'communication skills', 'leadership'],
    overview: 'Explore the Communication & Leadership Pathway if your goals include public speaking, presenting, or leading a team.',
  },
  {
    name: 'Unwritten Skills',
    keywords: [],
    overview: 'If you’re interested in Unwritten Skills, share the skills you want to develop so the team has context for your question.',
  },
];

const conversationReplies = [
  {
    phrases: ['hi', 'hello', 'hey'],
    reply: 'Hi{name}! Welcome to ZillionPathways. How can I help you today?',
  },
  {
    phrases: ['good morning', 'good afternoon', 'good evening'],
    reply: 'Hello{name}! Thanks for stopping by. What can I help you with?',
  },
  {
    phrases: ['who are you', 'what is your name', 'are you a real person'],
    reply: 'I’m the ZillionPathways virtual assistant.',
  },
  {
    phrases: ['help', 'i have a question', 'what can you help me with'],
    reply: 'Tell me what you’d like help with{name}.',
  },
  {
    phrases: ['do i have to share my details', 'can i skip'],
    reply: 'Sharing your details is optional. You can ask your question here.',
  },
  {
    phrases: ['can i speak to someone', 'can i talk to someone'],
    reply: 'Tell me what you’d like to discuss so the ZillionPathways team has some context for your follow-up.',
  },
  {
    phrases: ['thanks', 'thank you', 'thank you so much'],
    reply: 'You’re welcome{name}! Is there anything else I can help with?',
  },
  {
    phrases: ['bye', 'goodbye', 'see you'],
    reply: 'Thanks for visiting ZillionPathways{name}. Have a great day!',
  },
];

const intakeSteps = [
  {
    key: 'name',
    label: 'Full name',
    prompt: 'What’s your full name?',
    type: 'text',
    autocomplete: 'name',
    placeholder: 'Your full name',
    maxLength: 100,
    error: 'Enter your full name to continue.',
  },
  {
    key: 'email',
    label: 'Email address',
    prompt: 'Thanks{name}! What’s your email address?',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'you@example.com',
    maxLength: 254,
    error: 'Enter a valid email address, like you@example.com.',
  },
  {
    key: 'phone',
    label: 'Phone number',
    prompt: 'What’s your phone number? You can include the country code.',
    type: 'tel',
    autocomplete: 'tel',
    placeholder: '+971 50 123 4567',
    maxLength: 32,
    error: 'Enter a valid phone number, like +971 50 123 4567.',
  },
  {
    key: 'role',
    label: 'I am a…',
    prompt: 'Which best describes you?',
    options: ['Parent', 'Student', 'Working professional', 'Organisation'],
  },
  {
    key: 'pathway',
    label: 'I’m interested in',
    prompt: 'Which pathway are you interested in?',
    options: ['Not sure yet, please advise', ...pathways.map((pathway) => pathway.name)],
  },
];

const contactSteps = ['phone', 'email'].map((key) => intakeSteps.find((step) => step.key === key));
const chatForm = document.querySelector('#chat-form');
const reply = document.querySelector('#reply');
const sendButton = chatForm.querySelector('[type="submit"]');
const replyFeedback = document.querySelector('#reply-feedback');
const profileForm = document.querySelector('#profile-form');
const profileAnswer = document.querySelector('#profile-answer');
const profileLabel = document.querySelector('#profile-label');
const profileFeedback = document.querySelector('#profile-feedback');
const conversation = document.querySelector('#conversation');
const typingTemplate = document.querySelector('#typing-template');
const chatDescription = document.querySelector('#chat-description');
const clearChat = document.querySelector('#clear-chat');
const storageNotice = document.querySelector('#storage-notice');
const storageNoticeText = storageNotice.textContent;
const followUpReply = 'Someone from ZillionPathways will reach out to you for assistance.';
const visitorKey = 'helpdesk.demo.visitor.';
const activeChatKey = 'helpdesk.demo.activeChat';
const details = {};
const firstPromptActions = document.querySelector('#first-prompt-actions');
let promptActions = firstPromptActions;
let responseActions;
let responseState;
let visitor = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), followUps: [] };
let messages = [{ speaker: 'assistant', message: conversation.querySelector('.message-bubble p').textContent }];
let profileMode = 'initial';
let isTyping = false;
let flushReply;

function currentProfileStep() {
  const steps = profileMode === 'contact' ? contactSteps : intakeSteps;
  return steps.find((step) => !details[step.key]);
}

function hasContactDetails() {
  return Boolean(details.phone && details.email);
}

function saveVisitor(record) {
  const chat = { messages, profileMode, responseState, clearVisible: !clearChat.hidden };
  localStorage.setItem(visitorKey + record.id, JSON.stringify({ ...record, ...details, profileSubmitted: hasContactDetails(), chat }));
}

function saveHistory() {
  try {
    saveVisitor(visitor);
    sessionStorage.setItem(activeChatKey, visitor.id);
    if (storageNotice.textContent !== storageNoticeText) storageNotice.textContent = storageNoticeText;
  } catch {
    storageNotice.textContent = 'This browser couldn’t save your chat history for refresh.';
  }
}

function renderMessage({ speaker, message, prompt }) {
  const entry = document.createElement('div');
  entry.className = `message message-${speaker}`;
  const label = document.createElement('span');
  label.className = 'message-label';
  label.textContent = speaker === 'assistant' ? 'ZillionPathways' : 'You';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  const content = document.createElement('p');
  content.textContent = message;
  bubble.append(content);
  if (prompt) {
    const question = document.createElement('p');
    question.className = 'profile-question';
    question.textContent = prompt;
    bubble.append(question);
  }
  entry.append(label, bubble);
  conversation.append(entry);
  return bubble;
}

function addMessage(speaker, message, prompt) {
  const entry = { speaker, message, prompt };
  messages.push(entry);
  const bubble = renderMessage(entry);
  conversation.scrollTop = conversation.scrollHeight;
  return bubble;
}

function replyAfterTyping(renderReply, delay = 550) {
  const indicator = typingTemplate.content.firstElementChild.cloneNode(true);
  const controls = [clearChat, ...(responseActions?.querySelectorAll('button') ?? [])];
  isTyping = true;
  sendButton.disabled = true;
  for (const control of controls) control.disabled = true;
  conversation.append(indicator);
  conversation.scrollTop = conversation.scrollHeight;

  const finish = () => {
    flushReply = undefined;
    indicator.remove();
    isTyping = false;
    sendButton.disabled = Boolean(profileMode);
    for (const control of controls) control.disabled = false;
    renderReply();
    saveHistory();
  };
  const timer = window.setTimeout(finish, delay);
  flushReply = () => {
    window.clearTimeout(timer);
    finish();
  };
}

function resetChat() {
  clearResponseActions();
  messages = [];
  conversation.replaceChildren();
  clearChat.hidden = true;
  reply.value = '';
  clearReplyError();
  replyAfterTyping(() => addMessage('assistant', 'Type your question below.'));
}

function normalize(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function personalize(message) {
  const firstName = details.name?.split(/\s+/u)[0];
  return message.replace('{name}', () => firstName ? ', ' + firstName : '');
}

function findPathway(normalized) {
  const words = ' ' + normalized + ' ';
  return pathways.find((pathway) => words.includes(' ' + normalize(pathway.name) + ' '))
    ?? pathways.find((pathway) => pathway.keywords.some((keyword) => words.includes(' ' + keyword + ' ')));
}

function ask(input) {
  if (profileMode || isTyping) return;
  addMessage('visitor', input);
  clearChat.hidden = false;
  replyAfterTyping(() => answerQuestion(input));
}

function answerQuestion(input) {
  const normalized = normalize(input);
  const generalReply = conversationReplies.find(({ phrases }) => phrases.includes(normalized));
  if (generalReply) {
    addMessage('assistant', personalize(generalReply.reply));
    return;
  }

  const pathway = findPathway(normalized);
  if (pathway) {
    replyAboutPathway(input, pathway);
    return;
  }

  if (!recordFollowUp({ question: input })) {
    addMessage('assistant', 'Your question couldn’t be saved in this browser. Please try again.');
    return;
  }

  if (visitor.profileSubmitted) {
    addMessage('assistant', followUpReply);
    return;
  }

  const bubble = addMessage('assistant', 'I’m not able to answer you right away. Select Proceed to submit your details so someone from ZillionPathways can reach out to you for further assistance.');
  addResponseActions(bubble, { type: 'proceed' });
}

function recordFollowUp(entry) {
  const updatedVisitor = {
    ...visitor,
    followUps: [...visitor.followUps, { ...entry, savedAt: new Date().toISOString() }],
  };
  try {
    saveVisitor(updatedVisitor);
    visitor = updatedVisitor;
    return true;
  } catch {
    return false;
  }
}

function replyAboutPathway(question, pathway) {
  const message = 'You might want to explore our ' + pathway.name + '{name}. Select Know More for an overview or Call Back to request a call.';
  const bubble = addMessage('assistant', personalize(message));
  addResponseActions(bubble, { type: 'pathway', question, pathway: pathway.name });
}

function requestCallback(question, pathway) {
  const saved = recordFollowUp({ question, type: 'callback', pathway: pathway.name });
  if (saved && !visitor.profileSubmitted) {
    resumeProfile('Call Back', 'Share your contact details so the team can reach you about the ' + pathway.name + '.');
    return;
  }

  addMessage('visitor', 'Call Back');
  if (saved) clearResponseActions();
  replyAfterTyping(() => {
    const message = saved
      ? 'Your callback request for the ' + pathway.name + ' has been saved in this browser.'
      : 'Your callback request couldn’t be saved in this browser. Please try again.';
    addMessage('assistant', message);
  });
}

function clearResponseActions() {
  responseActions?.remove();
  responseActions = undefined;
  responseState = undefined;
}

function addResponseActions(bubble, state, messageIndex = messages.length - 1) {
  clearResponseActions();
  const actions = [];
  if (state.type === 'proceed' && !hasContactDetails()) {
    actions.push(['Proceed', () => resumeProfile('Proceed')]);
  } else if (state.type === 'pathway') {
    const pathway = pathways.find(({ name }) => name === state.pathway);
    if (!pathway || typeof state.question !== 'string') return;
    if (!state.overview) {
      actions.push(['Know More', () => {
        addMessage('visitor', 'Know More');
        replyAfterTyping(() => {
          const overview = addMessage('assistant', pathway.overview);
          addResponseActions(overview, { ...state, overview: true });
        });
      }]);
    }
    actions.push(['Call Back', () => requestCallback(state.question, pathway)]);
  }
  if (actions.length === 0) return;

  const group = document.createElement('div');
  group.className = 'response-actions';
  for (const [label, run] of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'primary-button';
    button.textContent = label;
    button.addEventListener('click', () => {
      if (!profileMode && !isTyping && responseActions === group) run();
    });
    group.append(button);
  }
  responseActions = group;
  responseState = { ...state, messageIndex };
  bubble.append(group);
  conversation.scrollTop = conversation.scrollHeight;
}

function resumeProfile(action, introduction) {
  clearResponseActions();
  setProfileMode('contact');
  clearChat.hidden = true;
  addMessage('visitor', action);
  replyAfterTyping(() => {
    if (introduction) addMessage('assistant', introduction);
    showIntakePrompt();
  });
}

function setProfileMode(mode) {
  profileMode = mode;
  const active = Boolean(mode);
  chatDescription.hidden = !active;
  reply.placeholder = active ? 'Select Skip to chat' : 'Type your question…';
  reply.disabled = active;
  sendButton.disabled = active;
}

function setProfileField(field) {
  profileLabel.textContent = field.label;
  profileAnswer.type = field.type;
  profileAnswer.autocomplete = field.autocomplete;
  profileAnswer.placeholder = field.placeholder;
  profileAnswer.maxLength = field.maxLength;
}

function clearProfileError() {
  profileFeedback.textContent = '';
  profileAnswer.removeAttribute('aria-invalid');
}

function clearReplyError() {
  replyFeedback.textContent = '';
  reply.removeAttribute('aria-invalid');
}

function showIntakePrompt() {
  const step = currentProfileStep();
  const bubble = addMessage('assistant', personalize(step.prompt));
  addProfileActions(bubble, step);
}

function addProfileActions(bubble, step, focus = true) {
  const actions = document.createElement('div');
  promptActions = actions;
  const skipQuestion = document.createElement('button');
  skipQuestion.type = 'button';
  skipQuestion.className = 'text-button skip-question';
  skipQuestion.textContent = 'Skip';
  skipQuestion.addEventListener('click', () => {
    if (promptActions === actions) advanceProfile();
  });

  if (step.options) {
    const choices = document.createElement('div');
    choices.className = 'choice-list';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', step.label);

    for (const option of step.options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-button';
      button.textContent = option;
      button.addEventListener('click', () => {
        if (promptActions === actions) advanceProfile(option);
      });
      choices.append(button);
    }
    actions.append(choices);
  } else {
    setProfileField(step);
    actions.append(profileForm);
  }

  actions.append(skipQuestion);
  bubble.append(actions);
  conversation.scrollTop = conversation.scrollHeight;
  if (!focus) return;
  if (step.options) {
    actions.querySelector('.choice-button').focus();
  } else {
    profileAnswer.focus();
  }
}

function advanceProfile(value) {
  if (!profileMode || isTyping) return;
  const answered = value !== undefined;
  if (answered) details[currentProfileStep().key] = value;

  promptActions.remove();
  promptActions = undefined;
  profileAnswer.value = '';
  clearProfileError();
  addMessage('visitor', value ?? 'Skip');
  if (answered && currentProfileStep()) {
    replyAfterTyping(showIntakePrompt);
    return;
  }

  replyAfterTyping(openChat);
}

function openChat() {
  if (profileMode === 'initial') reply.value = '';
  Object.assign(visitor, details, { profileSubmitted: hasContactDetails() });
  setProfileMode(null);
  let storageFailed = false;
  if (Object.keys(details).length > 0) {
    try {
      saveVisitor(visitor);
    } catch {
      storageFailed = true;
    }
  }

  clearChat.hidden = visitor.followUps.length === 0;
  if (storageFailed) {
    addMessage('assistant', 'Your profile couldn’t be saved in this browser. You can still type a question.');
  } else if (visitor.profileSubmitted && visitor.followUps.length > 0) {
    addMessage('assistant', followUpReply);
  } else {
    const message = details.name
      ? personalize('Thanks{name}! You can now type your question.')
      : 'You can now type your question.';
    addMessage('assistant', message);
  }
  reply.focus();
}

function restoreChat() {
  let stored;
  try {
    const id = sessionStorage.getItem(activeChatKey);
    if (!id) return false;
    stored = JSON.parse(localStorage.getItem(visitorKey + id));
    if (stored?.id !== id) return false;
  } catch {
    return false;
  }

  const chat = stored.chat;
  if (!Array.isArray(stored.followUps) || !Array.isArray(chat?.messages) || chat.messages.length === 0) return false;
  if (!chat.messages.every((entry) => entry && ['assistant', 'visitor'].includes(entry.speaker) && typeof entry.message === 'string')) return false;
  if (![null, 'initial', 'contact'].includes(chat.profileMode)) return false;

  for (const { key } of intakeSteps) {
    if (typeof stored[key] === 'string') details[key] = stored[key];
  }
  visitor = { id: stored.id, savedAt: stored.savedAt, followUps: stored.followUps, profileSubmitted: hasContactDetails() };
  messages = chat.messages;
  conversation.replaceChildren();
  const bubbles = messages.map(renderMessage);
  setProfileMode(chat.profileMode);
  const step = profileMode && currentProfileStep();
  if (step) {
    addProfileActions(bubbles.at(-1), step, false);
  } else {
    setProfileMode(null);
    clearChat.hidden = !chat.clearVisible;
    const state = chat.responseState;
    if (Number.isInteger(state?.messageIndex) && bubbles[state.messageIndex]) {
      addResponseActions(bubbles[state.messageIndex], state, state.messageIndex);
    }
  }
  conversation.scrollTop = conversation.scrollHeight;
  return true;
}

function isValidIntakeAnswer(step, value) {
  if (!value || value.length > step.maxLength) return false;
  if (step.type === 'email') return !profileAnswer.validity.typeMismatch;
  if (step.type === 'tel') {
    const digits = value.replace(/\D/g, '');
    return /^\+?[\d().\s-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }
  return true;
}

reply.addEventListener('input', clearReplyError);
profileAnswer.addEventListener('input', clearProfileError);

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (profileMode || isTyping) return;
  const value = reply.value.trim();

  if (!value) {
    replyFeedback.textContent = 'Enter a question to continue.';
    reply.setAttribute('aria-invalid', 'true');
  } else {
    clearReplyError();
    ask(value);
    reply.value = '';
  }
  reply.focus();
});

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!profileMode || isTyping || !profileForm.isConnected) return;
  const step = currentProfileStep();
  const value = profileAnswer.value.trim();

  if (!isValidIntakeAnswer(step, value)) {
    profileFeedback.textContent = step.error;
    profileAnswer.setAttribute('aria-invalid', 'true');
    profileAnswer.focus();
    return;
  }

  advanceProfile(value);
});

clearChat.addEventListener('click', () => {
  if (profileMode || isTyping) return;
  resetChat();
  reply.focus();
});

const firstSkip = firstPromptActions.querySelector('.skip-question');
firstSkip.addEventListener('click', () => {
  if (promptActions === firstPromptActions) advanceProfile();
});
profileAnswer.disabled = false;
profileForm.querySelector('[type="submit"]').disabled = false;
window.addEventListener('pagehide', () => flushReply?.());
if (!restoreChat()) {
  replyAfterTyping(() => {
    const bubble = addMessage('assistant', 'You can share a few details so our team can follow up if needed, or select Skip to go straight to the chat.', intakeSteps[0].prompt);
    bubble.append(firstPromptActions);
    firstPromptActions.hidden = false;
    firstSkip.disabled = false;
    conversation.scrollTop = conversation.scrollHeight;
  }, 3000);
}
