import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,

  Volume2,
  VolumeX,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Download,
  Play,
  RefreshCw,
  BarChart2,
  MessageSquare,
  History,
  ArrowRightLeft,
  Pause,
  Grid,
  HelpCircle,
  Users,

  Landmark,
  User,
  Calendar,
  AlertCircle,
  Clock,
  Mic,
  MicOff,
  Sparkles,
  HeartHandshake,
  Sun,
  Moon
} from 'lucide-react';

const STATE_COLORS = {
  GREETING: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
  GREETING_IDENTITY_ASKED: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
  ASK_JITESH: 'from-slate-500/20 to-zinc-500/20 text-slate-400 border-slate-500/30',
  AMOUNT_DUE: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  BANK_NAME: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
  PAYMENT_CONFIRM: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  ASK_PAYMENT_DATE: 'from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30',
  ASK_CALLBACK_TIME: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
  CALL_ENDED_SUCCESS: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  CALL_ENDED_REFUSED: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
  CALL_ENDED_WRONG_NUMBER: 'from-slate-500/20 to-zinc-500/20 text-slate-400 border-slate-500/30',
  CALL_ENDED_UNCLEAR: 'from-slate-500/20 to-zinc-500/20 text-slate-400 border-slate-500/30',
  CALL_ENDED_FINANCIAL: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
  CALL_ENDED_CALLBACK: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  CALL_ENDED_ESCALATED: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
  CALL_FAILED: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
  DUE_DATE: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
  WRONG_AMOUNT: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  NEGOTIATE: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
  REMINDER_ASKED: 'from-cyan-500/20 to-sky-500/20 text-cyan-400 border-cyan-500/30',
  CONSEQUENCES_EXPLAINED: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30',
  CALL_ENDED_POLITE: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
};

// Mock response engine
const MOCK_START_RESPONSE = {
  session_id: 'mock_session_456',
  bot_text: 'Hello, kya meri baat Mahima Dangi se ho rahi hai?',
  audio_url: '/audio/mock_greeting.mp3'
};

const AFFIRM_WORDS = [
  "haan", "ha", "han", "haa", "ji", "yes", "y", "theek", "thik",
  "ok", "okay", "bilkul", "sahi", "haanji", "haan ji", "kardo",
  "bhejdo", "bhej do", "kar do", "bhej de", "bhej dena", "bhejye",
  "sure", "confirm", "speaking", "yep", "correct", "main hi", "bol raha",
  "bol rahi", "bol rahi hoon", "bol rahi hu", "bol raha hoon", "bol raha hu",
  "main hoon", "mai hoon", "hoon", "hu",
  "pay", "dunga", "karunga", "pay kar",
  "theek hai", "thik hai", "ok kar do", "ok kardo", "okay kar do", "okay kardo",
  "हाँ", "जी", "ठीक", "हां", "हाँजी", "हाँ जी", "भेज दो", "कर दो", "सही",
  "बिल्कुल", "बिलकुल", "ठीक है", "ठिक है", "ओके", "ओके कर दो", "ओके करदो", "हांजी", "हां जी"
];

const DENY_WORDS = [
  "nahi", "nahin", "naa", "no", "n", "cancel",
  "mana", "inkar", "reject",
  "नहीं", "नही", "ना"
];

const BANK_QUESTION_PATTERNS = [
  /\bkonse?\s*bank\b/i,
  /\bkaunse?\s*bank\b/i,
  /\bkounse?\s*bank\b/i,
  /\bkon\s*sa\s*bank\b/i,
  /\bkaun\s*sa\s*bank\b/i,
  /\bkoun\s*sa\s*bank\b/i,
  /\bkon\s*se\s*bank\b/i,
  /\bkaun\s*se\s*bank\b/i,
  /\bkoun\s*se\s*bank\b/i,
  /\bkis\s*bank\b/i,
  /\bwhich\s*bank\b/i,
  /\bbank\s*kaunsa?\b/i,
  /\bbank\s*kounsa?\b/i,
  /\bbank\s*konse?\b/i,
  /\bbank\s*se\s*bol\b/i,
  /\bicici\b/i,
  /\bsbi\b/i,
  /\bhdfc\b/i,
  /\baxis\b/i,
  /\bbank\b/i,
  /कौन\s*सा\s*बैंक/i,
  /कौन\s*से\s*बैंक/i,
  /कौनसा\s*बैंक/i,
  /कौनसे\s*बैंक/i,
  /किस\s*बैंक/i,
  /कौन\s*बैंक/i,
  /बैंक/i
];

const WRONG_PERSON_PATTERNS = [
  /\bwrong\b/i,
  /\brong\b/i,
  /\bgalat\b/i,
  /\bwrong\s*number\b/i,
  /\brong\s*number\b/i,
  /\bgalat\s*number\b/i,
  /\bgalat\s*insaan\b/i,
  /\bgalat\s*banda\b/i,
  /\bgalat\s*bande\b/i,
  /\bgalat\s*person\b/i,
  /गलत\s*नंबर/i,
  /गलत\s*इंसान/i,
  /गलत\s*बंदा/i,
  /गलत\s*बंदे/i,
  /\byeh\s+jitesh\s+nah?i\s+hai/i,
  /\bmain\s+unka\s+bhai/i,
  /\bmain\s+unka\s+friend/i,
  /\bunka\s+bhai/i,
  /\bunki\s+wife/i,
  /\bwife\s+bol/i,
  /\bpapa\s+bol/i,
  /\bfriend\s+bol/i,
  /\bbrother\s+bol/i,
  /\bmahima/i,
  /bol\s*rahi\s*hoon/i,
  /bol\s*rahi\s*hu/i,
  /bol\s*rahi\s*ho/i,
  /गलत/i,
  /यह\s*जितेश\s*नहीं\s*है/i,
  /भाई\s*बोल/i,
  /पाषा\s*बोल/i,
  /पापा\s*बोल/i,
  /पत्नी\s*बोल/i,
  /दोस्त\s*बोल/i
];

const ASK_IDENTITY_PATTERNS = [
  /\baap\s+kaun\b/i,
  /\bkaun\s+ho\b/i,
  /\bkoun\s+ho\b/i,
  /\bkahan\s+se\b/i,
  /\bkahāñ\s+se\b/i,
  /\bkaunsi\s+company\b/i,
  /\bkaun\s+si\s+company\b/i,
  /\bkounsi\s+company\b/i,
  /\bkya\s+naam\b/i,
  /\bnaam\s+kya\b/i,
  /\bkiske\s+liye\b/i,
  /\bkis\s+liye\b/i,
  /\bkya\s+kaam\b/i,
  /\bkis\s*liye\s*hai\b/i,
  /\bwho\s+is\s+this\b/i,
  /\bwho\s+are\s+you\b/i,
  /\bji\s+kaun\b/i,
  /\bji\s+koun\b/i,
  /आप\s*कौन/i,
  /कौन\s*हो/i,
  /कहाँ\s*से/i,
  /कहां\s*से/i,
  /कौनसी\s*कंपनी/i,
  /कौन\s*सी\s*कंपनी/i,
  /क्या\s*नाम/i,
  /नाम\s*क्या/i,
  /किसलिए/i,
  /किस\s*लिए/i,
  /जी\s*कौन/i
];

const ASK_AMOUNT_PATTERNS = [
  /\bkitna\b/i,
  /\bkitne\b/i,
  /\bkitni\b/i,
  /\bpaisa\b/i,
  /\bpaise\b/i,
  /\bdue\b/i,
  /\bbaki\b/i,
  /\bbaaki\b/i,
  /\bbalance\b/i,
  /\bhow\s+much\b/i,
  /\bamount\b/i,
  /\bemi\b/i,
  /\byaad\b/i,
  /कितना/i,
  /कितने/i,
  /कितनी/i,
  /पैसा/i,
  /पैसे/i,
  /बाकी/i,
  /ड्यू/i,
  /ईएमआई/i,
  /याद/i
];

const ALREADY_PAID_PATTERNS = [
  /\bpay\s+kar\s+diya\b/i,
  /\bpayment\s+kar\s+diya\b/i,
  /\bpaid\b/i,
  /\balready\s+paid\b/i,
  /\bde\s+diya\b/i,
  /\bbhej\s+diya\b/i,
  /\bkar\s+diya\s+hai\b/i,
  /पे\s*कर\s*दिया/i,
  /पेमेंट\s*कर\s*दिया/i,
  /दे\s*दिया/i
];

const CALLBACK_PATTERNS = [
  /\bbusy\b/i,
  /\bmeeting\b/i,
  /\bbaad\s+me\b/i,
  /\bbaad\s+mein\b/i,
  /\bbaje\b/i,
  /\btime\b/i,
  /\bcall\s+back\b/i,
  /\bbaad\s+mai\b/i,
  /\bcall\s+later\b/i,
  /\blater\b/i,
  /\bdriving\b/i,
  /\boffice\b/i,
  /बिजी/i,
  /व्यस्त/i,
  /मीटिंग/i,
  /बाद\s*में/i,
  /बजे/i,
  /कॉल\s*बैक/i
];

const ANGRY_PATTERNS = [
  /\bbakwaas\b/i,
  /\bbakwas\b/i,
  /\bpareshan\b/i,
  /\bpareshān\b/i,
  /\bharass\b/i,
  /\btameez\b/i,
  /\bshutup\b/i,
  /\bshut\s+up\b/i,
  /\bpareshan\s+mat\b/i,
  /\bcall\s+mat\s+karo\b/i,
  /\bgussa\s+mat\s+dilao\b/i,
  /\bgussa\b/i,
  /बकवास/i,
  /परेशान/i,
  /तमीज/i,
  /तमीज़/i
];

const ABUSIVE_PATTERNS = [
  /\bidiot\b/i,
  /\bstupid\b/i,
  /\bbadtameez\b/i,
  /\bfool\b/i,
  /\bnonsense\b/i,
  /\bbad\s+words\b/i,
  /\babuse\b/i,
  /\bfucking\b/i
];

const HUMAN_AGENT_PATTERNS = [
  /\bmanager\b/i,
  /\bhuman\b/i,
  /\brepresentative\b/i,
  /\bagent\b/i,
  /\bbaat\s+karao\b/i,
  /\bbaat\s+karaiye\b/i,
  /\bbaat\s+karva\b/i,
  /\bconnect\b/i,
  /\btransfer\b/i,
  /\blive\s+person\b/i,
  /\bperson\b/i,
  /मैनेजर/i,
  /ह्यूमन/i,
  /एजेंट/i,
  /प्रतिनिधि/i,
  /बात\s*कराओ/i,
  /बात\s*करवाओ/i,
  /बात\s*करो/i,
  /ट्रांसफर/i
];

const ASK_SENSITIVE_PATTERNS = [
  /\bpan\b/i,
  /\baccount\b/i,
  /\baadhaar\b/i,
  /\badhar\b/i,
  /\bpersonal\b/i,
  /\bdetails\b/i,
  /\bcard\b/i,
  /पैन/i,
  /अकाउंट/i,
  /आधार/i
];

const ASK_LINK_PATTERNS = [
  /\blink\b/i,
  /\bwhatsapp\b/i,
  /\bsms\b/i,
  /\bqr\b/i,
  /\bupi\b/i,
  /\bphonepe\b/i,
  /\bphone\s*pe\b/i,
  /\bgpay\b/i,
  /\bgoogle\s*pay\b/i,
  /\bpaytm\b/i,
  /\bbhejo\b/i,
  /\bbhej\b/i,
  /\bsend\b/i,
  /लिंक/i,
  /व्हाट्सएप/i,
  /व्हाट्सऐप/i,
  /एसएमएस/i,
  /क्यूआर/i,
  /यूपीआई/i,
  /भेजो/i,
  /भेज/i
];

const PROMISE_TO_PAY_PATTERNS = [
  /\bkal\b/i,
  /\bparso\b/i,
  /\bparson\b/i,
  /\baaj\s+shaam\b/i,
  /\bkal\s+subah\b/i,
  /\bkal\s+dopahar\b/i,
  /\bkal\s+shaam\b/i,
  /\bparso\s+subah\b/i,
  /\bmonday\b/i,
  /\btuesday\b/i,
  /\bwednesday\b/i,
  /\bthursday\b/i,
  /\bfriday\b/i,
  /\bsaturday\b/i,
  /\bsunday\b/i,
  /\bnext\s+week\b/i,
  /\bagle\s+hafte\b/i,
  /\bagle\s+week\b/i,
  /\b2\s+din\s+baad\b/i,
  /\b3\s+tareekh\s+ko\b/i,
  /\bmahine\s+ke\s+end\s+mein\b/i,
  /\bsalary\b/i,
  /\bshaam\b/i,
  /\bghante\s+baad\b/i,
  /\btime\s+do\b/i,
  /\bdono\b/i,
  /\bkar\s+dunga\b/i,
  /\bpayment\s+kar\s+dunga\b/i,
  /\bpay\s+karunga\b/i,
  /\bjama\s+kar\s+dunga\b/i,
  /\btransfer\s+kar\s+dunga\b/i,
  /\bpay\s+kar\s+dunga\b/i,
  /\bpayment\s+kar\s+dungi\b/i,
  /\bpay\s+karungi\b/i,
  /कल/i,
  /परसो/i,
  /परसों/i,
  /आज\s*शाम/i,
  /सैलरी/i,
  /सोमवार/i,
  /मंगलवार/i,
  /बुधवार/i,
  /गुरुवार/i,
  /शुक्रवार/i,
  /शनिवार/i,
  /रविवार/i,
  /अगले\s*हफ्ते/i,
  /शाम/i,
  /घंटे\s*बाद/i,
  /कर\s*दूंगा/i,
  /कर\s*दूंगी/i,
  /जमा/i,
  /पेमेंट/i
];

const FINANCIAL_PROBLEM_PATTERNS = [
  /\bpaise?\s+nah?i\b/i,
  /\bjob\s+chali\b/i,
  /\bnaukri\b/i,
  /\bhospital\b/i,
  /\bbimar\b/i,
  /\bfinancial\b/i,
  /\bmushkil\b/i,
  /\bloss\b/i,
  /\bnuksan\b/i,
  /पैसे\s*नहीं/i,
  /नौकरी\s*चली/i,
  /अस्पताल/i,
  /बीमार/i,
  /नुकसान/i,
  /आर्थिक/i
];

const ACKNOWLEDGE_WORDS = [
  "bataiye", "boliye", "hello", "batao", "bolo", "ji boliye", "acha", "achha",
  "बताइए", "बोलिए", "हैलो", "हेलो", "बताओ", "बोलो", "अच्छा", "अच्चा"
];

const OUT_OF_SCOPE_PATTERNS = [
  /\bweather\b/i,
  /\bmausam\b/i,
  /\bmatch\b/i,
  /\bjeetega\b/i,
  /\bwin\b/i,
  /\bai\b/i,
  /\brobot\b/i,
  /\bbot\b/i,
  /\bcomputer\b/i,
  /\bseason\b/i,
  /\btum\s+ai\b/i,
  /\btum\s+robot\b/i,
  /\btum\s+bot\b/i,
  /मौसम/i,
  /मैच/i,
  /जीतेगा/i,
  /रोबोट/i,
  /बॉट/i,
  /एआई/i
];

const NOISE_PATTERNS = [
  /^h+m+$/i,
  /^h+m+x*$/i,
  /^\.+$/i,
  /^background\s*noise$/i,
  /^\(background\s*noise\)$/i,
  /^\[noise\]$/i,
  /^uh+$/i,
  /^ah+$/i,
  /^ह+म्+$/i
];

// AUDIO_CHECK: customer is asking if they can be heard, or says audio is unclear
// This is an ACTIVE response — treat as engagement, not silence/unclear
const AUDIO_CHECK_PATTERNS = [
  /\bawaaz\s*nahi\b/i,
  /\baawaz\s*nahi\b/i,
  /\bsunaai\s*nahi\b/i,
  /\bsunai\s*nahi\b/i,
  /\bsuna\s*nahi\b/i,
  /\bkya\s+meri\s+awaaz\b/i,
  /\bkya\s+aap\s+sun\b/i,
  /\bhello\s+hello\b/i,
  /\bhello\?\s*hello\b/i,
  /\bkya\s+sun\s+pa\b/i,
  /\bcan\s+you\s+hear\b/i,
  /\bhear\s+me\b/i,
  /\baudio\s+theek\b/i,
  /\baudio\s+clear\b/i,
  /आवाज़?\s*नहीं/i,
  /सुनाई\s*नहीं/i,
  /सुना\s*नहीं/i,
  /क्या\s*मेरी\s*आवाज़?/i,
  /क्या\s*आप\s*सुन/i,
  /हैलो\s*हैलो/i,
  /हेलो\s*हेलो/i
];

const ASK_DUE_DATE_PATTERNS = [
  /\bdue\s*date\b/i,
  /\bkab\s+tak\s+pay\b/i,
  /\bkab\s+tak\s+karna\b/i,
  /\blast\s+date\b/i,
  /\bpayment\s+date\b/i,
  /\bdate\s+kya\b/i,
  /\bkab\s+karna\s+hai\b/i,
  /\bkab\s+bharna\s+hai\b/i,
  /\bkab\s+dena\s+hai\b/i,
  /ड्यू\s*डेट/i,
  /कब\s*तक/i,
  /अंतिम\s*तिथि/i,
  /आखिरी\s*तारीख/i
];

const WRONG_AMOUNT_PATTERNS = [
  /\b5000\s*nah?i\b/i,
  /\bgalat\s*amount\b/i,
  /\bgalat\s*outstanding\b/i,
  /\bwrong\s*amount\b/i,
  /\bwrong\s*outstanding\b/i,
  /\bpaise\s*galat\b/i,
  /\bamount\s*galat\b/i,
  /गलत\s*अमाउंट/i,
  /गलत\s*पैसे/i,
  /५०००\s*नहीं/i
];

const NEGOTIATE_PATTERNS = [
  /\bdiscount\b/i,
  /\bsettlement\b/i,
  /\bwaiver\b/i,
  /\bmaaf\b/i,
  /\bhatao\b/i,
  /\bkam\s+karo\b/i,
  /\bkam\s+kijiye\b/i,
  /\bsettle\b/i,
  /\bdiscount\s*milega\b/i,
  /\binterest\s*hatao\b/i,
  /\u0921\u093f\u0938\u094d\u0915\u093e\u0909\u0902\u091f/i,
  /\u0938\u0947\u091f\u0932\u092e\u0947\u0902\u091f/i,
  /\u092e\u093e\u092b\u093c/i,
  /\u092e\u093e\u092b/i,
  /\u0915\u092e\s*\u0915\u0930\u094b/i
];

const MAYBE_PATTERNS = [
  /\bdekhta\s+hoon\b/i,
  /\bdekhti\s+hoon\b/i,
  /\bsochunga\b/i,
  /\bsochungi\b/i,
  /\bsoch\s+ke\s+bata\b/i,
  /\bpata\s+nahi\b/i,
  /\bshayad\b/i,
  /\bmaybe\b/i,
  /\bpossibly\b/i,
  /\bsochna\s+hai\b/i,
  /\bsochta\s+hoon\b/i,
  /\bsochti\s+hoon\b/i,
  /\bkuch\s+nahi\s+pata\b/i,
  /\bconfirm\s+nahi\b/i,
  /\babhi\s+nahi\s+bata\s+sakta\b/i,
  /\u0926\u0947\u0916\u0924\u093e\s*\u0939\u0942\u0902/i,
  /\u0926\u0947\u0916\u0924\u0940\s*\u0939\u0942\u0902/i,
  /\u0938\u094b\u091a\u0942\u0902\u0917\u093e/i,
  /\u0938\u094b\u091a\u0942\u0902\u0917\u0940/i,
  /\u092a\u0924\u093e\s*\u0928\u0939\u0940\u0902/i,
  /\u0936\u093e\u092f\u0926/i,
  /\u0938\u094b\u091a\u0928\u093e\s*\u0939\u0948/i
];

const GOODBYE_PATTERNS = [
  /\bthank\s*you\b/i,
  /\bthanks\b/i,
  /\bbye\b/i,
  /\bgoodbye\b/i,
  /\bgood\s*night\b/i,
  /\bgood\s*morning\b/i,
  /\bgood\s*evening\b/i,
  /\bshubh\s*din\b/i,
  /\bdhanyavaad\b/i,
  /\bshukriya\b/i,
  /\btataa\b/i,
  /\bta\s*ta\b/i,
  /\balvida\b/i,
  /\bthik\s*hai\s*bye\b/i,
  /\bphone\s*rakhta\b/i,
  /\bphone\s*rakhti\b/i,
  /\bphone\s+rakho\b/i,
  /\bband\s+karo\b/i,
  /\bkhatam\b/i,
  /\bdisconnect\b/i,
  /\u0927\u0928\u094d\u092f\u0935\u093e\u0926/i,
  /\u0936\u0941\u0915\u094d\u0930\u093f\u092f\u093e/i,
  /\u0905\u0932\u0935\u093f\u0926\u093e/i,
  /\u092c\u093e\u092f/i,
  /\u0917\u0941\u0921\s*\u0928\u093e\u0907\u091f/i,
  /\u0936\u0941\u092d\s*\u0926\u093f\u0928/i
];

const UNCLEAR_PATTERNS = [
  /samajh/i,
  /awaaz/i,
  /aawaz/i,
  /suna/i,
  /sunai/i,
  /dobara/i,
  /repeat/i,
  /fir\s*se/i,
  /phir\s*se/i,
  /kya\s+bola/i,
  /kya\s+bol/i,
  /kya\s+keh/i,
  /समझ/i,
  /आवाज़/i,
  /आवाज/i,
  /सुना/i,
  /सुनाई/i,
  /दोबारा/i,
  /फिर\s*से/i,
  /क्या\s*बोला/i,
  /क्या\s*कहा/i
];

const cleanCallbackTime = (text) => {
  if (!text) return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/[.!?।]+$/, '').trim();
  cleaned = cleaned.replace(/\b(?:call\s*karo|call\s*karna|phone\s*karo|phone\s*karna|karo|karna)\b/gi, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

const extractCallbackTime = (text) => {
  const clean = (text || '').trim().toLowerCase();
  if (!clean) return null;

  const invalidWords = ["baad mein", "baad me", "baad mai", "theek hai", "thik hai", "dekhenge", "haan", "han", "hmm", "hmmm", "ok", "okay", "yes", "no", "nahi", "nahin", "hello", "hi", "busy", "later"];
  if (invalidWords.includes(clean)) {
    return null;
  }

  const timePatterns = [
    /\d+/,
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/,
    /\b(ek|do|teen|chaar|paanch|chah|che|saat|aath|nau|das|gyarah|barah)\b/,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/,
    /\b(somwar|mangalwar|budhwar|guruwar|veervar|shukrawar|shaniwar|ravivar|som|mangal|budh|guru|shukra|shani|ravi)\b/,
    /(सोमवार|मंगलवार|बुधवार|गुरुवार|वीरवार|शुक्रवार|शनिवार|रविवार)/,
    /\b(baje|pm|am|o'clock|oclock)\b/,
    /(बजे|पीएम|एएम)/,
    /\b(subah|dopahar|dophar|shaam|sham|raat|kal|parso|parson)\b/,
    /(सुबह|दोपहर|शाम|रात|कल|परसों)/
  ];

  if (timePatterns.some(pat => pat.test(clean))) {
    return cleanCallbackTime(text);
  }

  return null;
};

const formatDate = (date) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

const normalizeRelativeDate = (text) => {
  if (!text) return null;
  const clean = text.toLowerCase().trim();
  const now = new Date();

  // Helper to format
  const fmt = (d) => formatDate(d);

  // 1. 7 din baad / saat din baad / 7 days
  if (clean.includes("7 din") || clean.includes("saat din") || clean.includes("7 day") || clean.includes("seven day")) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + 7);
    return fmt(dt);
  }

  // 2. ek hafte baad / one week / 1 week / ek week / ek hafte
  if (clean.includes("ek hafte") || clean.includes("one week") || clean.includes("1 week") || clean.includes("ek week") || clean.includes("1 hafte")) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + 7);
    return fmt(dt);
  }

  // 3. 2 din baad / do din baad / 2 days / two days
  if (clean.includes("2 din") || clean.includes("do din") || clean.includes("2 day") || clean.includes("two day")) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + 2);
    return fmt(dt);
  }

  // 4. 3 din baad / teen din baad / 3 days / three days
  if (clean.includes("3 din") || clean.includes("teen din") || clean.includes("3 day") || clean.includes("three day")) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + 3);
    return fmt(dt);
  }

  // 5. agle Monday / next Monday (or other weekdays with "next" or "agle")
  const weekdaysEn = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const weekdaysHi = ["somwar", "mangalwar", "budhwar", "guruwar", "shukrawar", "shaniwar", "ravivar"];
  const weekdaysHiAlt = ["somvaar", "mangalvaar", "budhvaar", "guruvaar", "shukrawaar", "shaniwaar", "ravivaar"];
  const weekdaysHiDev = ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"];

  for (let i = 0; i < 7; i++) {
    const matchEn = clean.match(new RegExp(`\\b(?:next|agle|अगले|अगला)\\s+${weekdaysEn[i]}\\b`));
    const matchHi = clean.match(new RegExp(`\\b(?:next|agle|अगले|अगला)\\s+${weekdaysHi[i]}\\b`));
    const matchHiAlt = clean.match(new RegExp(`\\b(?:next|agle|अगले|अगला)\\s+${weekdaysHiAlt[i]}\\b`));
    const matchHiDev = clean.includes(`अगले ${weekdaysHiDev[i]}`) || clean.includes(`अगला ${weekdaysHiDev[i]}`);

    if (matchEn || matchHi || matchHiAlt || matchHiDev) {
      const currentWeekday = now.getDay();
      const currentWeekdayNormalized = currentWeekday === 0 ? 6 : currentWeekday - 1;
      let daysAhead = (i - currentWeekdayNormalized) % 7;
      if (daysAhead <= 0) daysAhead += 7;
      const dt = new Date(now);
      dt.setDate(now.getDate() + daysAhead);
      return fmt(dt);
    }
  }

  // 6. mahine ke end mein / month end / end of month
  if (clean.includes("mahine ke end") || clean.includes("month end") || clean.includes("end of the month") || clean.includes("end of month") || clean.includes("mahine ke aakhiri")) {
    const dt = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of current month
    return fmt(dt);
  }

  // 7. salary aane ke baad / salary aane par
  if (clean.includes("salary") || clean.includes("salaray") || clean.includes("सैलरी")) {
    const dt = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return fmt(dt);
  }

  // 8. agle mahine / next month / agle month
  if (clean.includes("agle mahine") || clean.includes("next month") || clean.includes("agle month") || clean.includes("अगले महीने") || clean.includes("अगले महिने")) {
    const dt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return fmt(dt);
  }

  // 9. next week / agle hafte / agle week
  if (clean.includes("next week") || clean.includes("agle hafte") || clean.includes("agle week") || clean.includes("अगले हफ्ते")) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + 7);
    return fmt(dt);
  }

  // 10. parso / parson / day after tomorrow
  if (clean.includes("parso") || clean.includes("parson") || clean.includes("day after tomorrow") || clean.includes("परसों") || clean.includes("परसो")) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + 2);
    return fmt(dt);
  }

  // 11. kal / tomorrow
  if (clean.includes("kal") || clean.includes("tomorrow") || clean.includes("कल")) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + 1);
    return fmt(dt);
  }

  // 12. aaj / today / aaj shaam
  if (clean.includes("aaj") || clean.includes("today") || clean.includes("आज")) {
    return fmt(now);
  }

  // 13. Weekdays without prefix
  for (let i = 0; i < 7; i++) {
    if (clean.includes(weekdaysEn[i]) || 
        clean.includes(weekdaysHi[i]) || 
        clean.includes(weekdaysHiAlt[i]) || 
        clean.includes(weekdaysHiDev[i])) {
      const currentWeekday = now.getDay();
      const currentWeekdayNormalized = currentWeekday === 0 ? 6 : currentWeekday - 1;
      let daysAhead = (i - currentWeekdayNormalized) % 7;
      if (daysAhead <= 0) daysAhead += 7;
      const dt = new Date(now);
      dt.setDate(now.getDate() + daysAhead);
      return fmt(dt);
    }
  }

  return null;
};

const extractSpecificDate = (text) => {
  if (!text) return null;
  const clean = text.toLowerCase().trim();
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
                  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthsPattern = months.join("|");

  // Try pattern: 27 June, 27th June, June 27
  const pattern1 = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(${monthsPattern})\\b`, "i");
  let m = clean.match(pattern1);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthRaw = m[2];
    const fullMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      .find(mon => mon.toLowerCase().startsWith(monthRaw));
    if (fullMonth) {
      return `${day} ${fullMonth}`;
    }
  }

  // Try pattern: June 27, June 27th
  const pattern2 = new RegExp(`\\b(${monthsPattern})\\s*(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i");
  m = clean.match(pattern2);
  if (m) {
    const day = parseInt(m[2], 10);
    const monthRaw = m[1];
    const fullMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      .find(mon => mon.toLowerCase().startsWith(monthRaw));
    if (fullMonth) {
      return `${day} ${fullMonth}`;
    }
  }

  // Try pattern: 28 tareekh ko, 28 tarikh
  const pattern3 = /\b(\d{1,2})\s*(?:tareekh|tarikh)\b/i;
  m = clean.match(pattern3);
  if (m) {
    const day = parseInt(m[1], 10);
    const now = new Date();
    if (day >= now.getDate()) {
      return `${day} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()]}`;
    } else {
      let nextMonth = now.getMonth() + 1;
      if (nextMonth > 11) {
        nextMonth = 0;
      }
      return `${day} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][nextMonth]}`;
    }
  }

  return null;
};

const getPaymentConfirmText = (userText) => {
  const normalizedDate = normalizeRelativeDate(userText) || extractSpecificDate(userText);
  if (normalizedDate) {
    return `Maine aapki payment ${normalizedDate} ke liye note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad.`;
  } else {
    return "Theek hai, maine aapki payment commitment note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad.";
  }
};

const checkFuzzyMatch = (word1, word2) => {
  const w1 = (word1 || "").toLowerCase().trim();
  const w2 = (word2 || "").toLowerCase().trim();
  if (!w1 || !w2) return false;
  if (w1 === w2) return true;
  
  const getBigrams = (s) => {
    const b = new Set();
    for (let i = 0; i < s.length - 1; i++) {
      b.add(s.slice(i, i + 2));
    }
    return b;
  };
  
  const b1 = getBigrams(w1);
  const b2 = getBigrams(w2);
  if (!b1.size || !b2.size) return false;
  
  let shared = 0;
  b1.forEach(bg => {
    if (b2.has(bg)) shared++;
  });
  
  const similarity = shared / Math.max(b1.size, b2.size);
  return similarity >= 0.7;
};

const detectIntent = (text, customerName = null) => {
  const clean = text.toLowerCase().trim();

  // 0. Check silence
  if (!clean || clean === '[silence]') {
    return 'SILENCE';
  }

  // 0b. Check noise
  for (const pat of NOISE_PATTERNS) {
    if (pat.test(clean)) return 'NOISE';
  }

  // 0c. Check AUDIO_CHECK — customer asking if they can be heard / audio unclear
  // Must come before UNCLEAR so it isn't swallowed by the generic unclear bucket
  for (const pat of AUDIO_CHECK_PATTERNS) {
    if (pat.test(clean)) return 'AUDIO_CHECK';
  }
  
  // 1. Check sensitive queries
  for (const pat of ASK_SENSITIVE_PATTERNS) {
    if (pat.test(clean)) return 'ASK_SENSITIVE';
  }
  
  // 1b. Check angry
  for (const pat of ANGRY_PATTERNS) {
    if (pat.test(clean)) return 'ANGRY';
  }
  
  // 1c. Check abusive
  for (const pat of ABUSIVE_PATTERNS) {
    if (pat.test(clean)) return 'ABUSIVE';
  }
  
  // 1d. Check human agent escalation
  for (const pat of HUMAN_AGENT_PATTERNS) {
    if (pat.test(clean)) return 'HUMAN_AGENT';
  }

  // 1e. Check out of scope
  for (const pat of OUT_OF_SCOPE_PATTERNS) {
    if (pat.test(clean)) return 'OUT_OF_SCOPE';
  }

  // 1f. Check due date request
  for (const pat of ASK_DUE_DATE_PATTERNS) {
    if (pat.test(clean)) return 'ASK_DUE_DATE';
  }

  // 1g. Check wrong amount
  for (const pat of WRONG_AMOUNT_PATTERNS) {
    if (pat.test(clean)) return 'WRONG_AMOUNT';
  }

  // 1h. Check negotiate
  for (const pat of NEGOTIATE_PATTERNS) {
    if (pat.test(clean)) return 'NEGOTIATE';
  }

  // 1i. Check GOODBYE (thank you, bye, good night…)
  for (const pat of GOODBYE_PATTERNS) {
    if (pat.test(clean)) return 'GOODBYE';
  }

  // 1j. Check MAYBE (dekhta hoon, pata nahi, shayad…)
  for (const pat of MAYBE_PATTERNS) {
    if (pat.test(clean)) return 'MAYBE';
  }

  // 2. Check identity questions first
  for (const pat of ASK_IDENTITY_PATTERNS) {
    if (pat.test(clean)) return 'ASK_IDENTITY';
  }
  
  // 3. Check bank question
  for (const pat of BANK_QUESTION_PATTERNS) {
    if (pat.test(clean)) return 'ASK_BANK';
  }
  
  // 4. Check wrong person
  // Build wrongPersonPatterns dynamically
  let firstName = "jitesh";
  let isFemale = false;
  let hasMahima = false;

  if (customerName) {
    const nameLower = customerName.toLowerCase().trim();
    firstName = nameLower.split(' ')[0];
    if (nameLower.startsWith("mahima") || nameLower.includes("dangi") || nameLower.startsWith("kiran") || nameLower.startsWith("pooja") || nameLower.startsWith("neha")) {
      isFemale = true;
    }
    if (nameLower.includes("mahima")) {
      hasMahima = true;
    }

    // Name mismatch check
    const expectedParts = nameLower.split(/\s+/).map(p => p.trim()).filter(Boolean);
    const nameMatchPatterns = [
      /(?:main|मैं)\s+([a-zA-Z]+|[\u0900-\u097F]+)\s+(?:bol|hoon|hu|बोल|हूं|हूँ|bolta|bolti|raha|rahi)(?:\s|$|[.,!?])/i,
      /(?:mera\s+naam|मेरा\s+नाम)\s+([a-zA-Z]+|[\u0900-\u097F]+)\s+(?:hai|है|he)(?:\s|$|[.,!?])/i,
      /([a-zA-Z]+|[\u0900-\u097F]+)\s+(?:bol\s+raha|bol\s+rahi|बोल\s+रहा|बोल\s+रही)(?:\s|$|[.,!?])/i,
      /this\s+is\s+([a-zA-Z]+|[\u0900-\u097F]+)(?:\s|$|[.,!?])/i,
      /([a-zA-Z]+|[\u0900-\u097F]+)\s+speaking(?:\s|$|[.,!?])/i
    ];
    for (const pat of nameMatchPatterns) {
      const m = pat.exec(clean);
      if (m) {
        const extracted = m[1].toLowerCase().trim();
        const ignoreList = ["unka", "uska", "apka", "aapka", "kya", "mera", "mai", "main", "bol", "hi", "he", "hee", "h", "ji", "ko"];
        if (extracted && !expectedParts.includes(extracted) && !ignoreList.includes(extracted)) {
          return 'WRONG_PERSON';
        }
      }
    }
  }

  const wrongPersonPatterns = [
    /\bwrong\b/i,
    /\brong\b/i,
    /\bgalat\b/i,
    /\bwrong\s*number\b/i,
    /\brong\s*number\b/i,
    /\bgalat\s*number\b/i,
    /\bgalat\s*insaan\b/i,
    /\bgalat\s*banda\b/i,
    /\bgalat\s*bande\b/i,
    /\bgalat\s*person\b/i,
    /गलत\s*नंबर/i,
    /गलत\s*नम्बर/i,
    /रॉन्ग\s*नंबर/i,
    /रॉन्ग\s*नम्बर/i,
    /रोंग\s*नंबर/i,
    /रोंग\s*नम्बर/i,
    /रॉन्ग/i,
    /रोंग/i,
    /गलत/i,
    /गलत\s*इंसान/i,
    /गलत\s*बंदा/i,
    /गलत\s*बंदे/i,
    new RegExp(`\\byeh\\s+${firstName}\\s+nah?i\\s+hai\\b`, 'i'),
    new RegExp(`\\bmain\\s+unka\\s+bhai\\b`, 'i'),
    new RegExp(`\\bmain\\s+unka\\s+friend\\b`, 'i'),
    new RegExp(`\\bunka\\s+bhai\\b`, 'i'),
    new RegExp(`\\bunki\\s+wife\\b`, 'i'),
    new RegExp(`\\bwife\\s+bol\\b`, 'i'),
    new RegExp(`\\bpapa\\s+bol\\b`, 'i'),
    new RegExp(`\\bfriend\\s+bol\\b`, 'i'),
    new RegExp(`\\bbrother\\s+bol\\b`, 'i'),
    new RegExp(`यह\\s*${firstName}\\s*नहीं\\s*है`, 'i'),
    / भाई\s*बोल/i,
    /पाषा\s*बोल/i,
    /पापा\s*बोल/i,
    /पत्नी\s*बोल/i,
    /दोस्त\s*बोल/i,
    new RegExp(`\\b(?:main|mai|मैं)\\s+${firstName}\\s+(?:nah?i|नहीं|नही)\\s+(?:hoon|hu|हूं|हूँ)\\b`, 'i')
  ];

  if (!hasMahima) {
    wrongPersonPatterns.push(/\bmahima\b/i);
  }

  if (!isFemale) {
    wrongPersonPatterns.push(/bol\s*rahi\s*hoon/i);
    wrongPersonPatterns.push(/bol\s*rahi\s*hu/i);
    wrongPersonPatterns.push(/bol\s*rahi\s*ho/i);
  }

  // Standalone different name check (if only one word is said and it is a name not matching the customer)
  if (customerName) {
    const expectedParts = customerName.toLowerCase().split(/\s+/).map(p => p.trim()).filter(Boolean);
    const words = clean.match(/[a-zA-Z\u0900-\u097F]+/g) || [];
    if (words.length === 1) {
      const w = words[0];
      let isExpected = false;
      for (const part of expectedParts) {
        if (part.length >= 3 && checkFuzzyMatch(w, part)) {
          isExpected = true;
          break;
        }
      }
      if (!isExpected) {
        const ignoreWords = ["haan", "ha", "han", "haa", "ji", "yes", "y", "ok", "okay", "no", "nah", "nahi", "nahin", "naa", "correct", "wrong", "galat", "hello", "hi", "speaking", "हाँ", "जी", "ठीक", "हां", "नहीं", "नही"];
        if (!ignoreWords.includes(w)) {
          return 'WRONG_PERSON';
        }
      }
    }
  }

  for (const pat of wrongPersonPatterns) {
    if (pat.test(clean)) return 'WRONG_PERSON';
  }

  // 4b. Fuzzy identity name confirmation check
  if (customerName) {
    const expectedParts = customerName.toLowerCase().split(/\s+/).map(p => p.trim()).filter(p => p.length >= 3);
    const words = clean.split(/\s+/).map(p => p.trim()).filter(Boolean);
    let hasNameMatch = false;
    for (const part of expectedParts) {
      if (clean === part || checkFuzzyMatch(clean, part)) {
        hasNameMatch = true;
        break;
      }
      for (const w of words) {
        if (checkFuzzyMatch(w, part)) {
          hasNameMatch = true;
          break;
        }
      }
      if (hasNameMatch) break;
    }
    if (hasNameMatch) {
      const hasNegation = ["nahi", "nahin", "naa", "no", "galat", "wrong", "नहीं", "नही", "ना"].some(word => clean.includes(word));
      if (!hasNegation) {
        return 'AFFIRM';
      }
    }
  }
  
  // 5. Check payment link request
  for (const pat of ASK_LINK_PATTERNS) {
    if (pat.test(clean)) return 'ASK_LINK';
  }
  
  // 6. Check callback
  for (const pat of CALLBACK_PATTERNS) {
    if (pat.test(clean)) return 'CALLBACK';
  }
  
  // 8. Check already paid
  for (const pat of ALREADY_PAID_PATTERNS) {
    if (pat.test(clean)) return 'ALREADY_PAID';
  }
  
  // 8b. Check financial problem
  for (const pat of FINANCIAL_PROBLEM_PATTERNS) {
    if (pat.test(clean)) return 'FINANCIAL_PROBLEM';
  }
  
  // 8c. Check promise to pay (dynamic & keyword-based)
  if (normalizeRelativeDate(text) || extractSpecificDate(text)) {
    return 'PROMISE_TO_PAY';
  }
  for (const pat of PROMISE_TO_PAY_PATTERNS) {
    if (pat.test(clean)) return 'PROMISE_TO_PAY';
  }
  
  // 9. Check ask amount
  // If a deny word is present, we only match if there's also a question word
  let hasDenyWord = false;
  for (const word of DENY_WORDS) {
    if (word.includes(' ') || /[\u0900-\u097F]/.test(word)) {
      if (clean.includes(word)) { hasDenyWord = true; break; }
    } else {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(clean)) { hasDenyWord = true; break; }
    }
  }

  if (hasDenyWord) {
    const questionPatterns = [/kitna/i, /kitne/i, /kitni/i, /how/i, /कितना/i, /कितने/i, /कितनी/i];
    const hasQuestion = questionPatterns.some(pat => pat.test(clean));
    if (hasQuestion) {
      for (const pat of ASK_AMOUNT_PATTERNS) {
        if (pat.test(clean)) return 'ASK_AMOUNT';
      }
    }
  } else {
    for (const pat of ASK_AMOUNT_PATTERNS) {
      if (pat.test(clean)) return 'ASK_AMOUNT';
    }
  }
  
  // 10. Check unclear override
  for (const pat of UNCLEAR_PATTERNS) {
    if (pat.test(clean)) return 'UNCLEAR';
  }
  
  // 11. Check acknowledge words
  for (const word of ACKNOWLEDGE_WORDS) {
    if (word.includes(' ') || /[\u0900-\u097F]/.test(word)) {
      if (clean.includes(word)) return 'ACKNOWLEDGE';
    } else {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(clean)) return 'ACKNOWLEDGE';
    }
  }
  
  // 12. Check Deny
  for (const word of DENY_WORDS) {
    if (word.includes(' ') || /[\u0900-\u097F]/.test(word)) {
      if (clean.includes(word)) return 'DENY';
    } else {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(clean)) return 'DENY';
    }
  }
  
  // 13. Check Affirm
  for (const word of AFFIRM_WORDS) {
    if (word.includes(' ') || /[\u0900-\u097F]/.test(word)) {
      if (clean.includes(word)) return 'AFFIRM';
    } else {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(clean)) return 'AFFIRM';
    }
  }
  
  return 'UNCLEAR';
};

const isIncompleteThought = (text) => {
  const clean = (text || '').trim().toLowerCase();
  if (!clean) return false;
  
  // 1. Trailing conjunctions/fillers/prepositions
  const trailingAscii = /\b(lekin|agar|ya|aur|aaur|ki|kyunki|kyonki|yaar|but|if|because|so|then|or|and)\b\s*[.…]*$/i;
  const trailingDevanagari = /(?:^|\s)(लेकिन|अगर|या|और|कि|क्योंकि|यार)\s*[.…]*$/i;
  if (trailingAscii.test(clean) || trailingDevanagari.test(clean)) return true;

  // 2. Starts with a subordinate conjunction but doesn't end with a clear verb or completion indicator
  const subordinatePatterns = [
    /\b(agar|lekin|kyunki|kyonki|if|but|because)\b/i,
    /(?:^|\s)(अगर|लेकिन|क्योंकि)(?:\s|$)/i
  ];
  if (subordinatePatterns.some(pat => pat.test(clean))) {
    // Common final verbs/helpers/conclusions
    const concludingPatterns = [
      /\b(hai|hain|hoon|hu|ho|tha|thi|the|gaya|gaye|gayi|karo|do|de|bhejo|bhej|bola|bol|boliye|bataiye|rha|raha|rahi|rahe|karunga|karungi|pay|link|karna|karke|rakhta|rakhti|rakho|bye|ok|okay|dhanyavaad|shukriya|alvida)\b\s*[.…]*$/i,
      /[\u0900-\u097F]+(है|हैं|हूं|हु|हो|था|थी|थे|गया|गए|गयी|करो|दो|दे|भेजो|भेज|बोला|बोल|बोलिए|बताइए|रहा|रही|रहे|करूंगा|करूंगी|करना|रखता|रखती|रखो|धन्यवाद|शुक्रिया|बाय)\s*[.…]*$/i
    ];
    // Future/present suffixes
    const suffixPattern = /\w+(unga|ungi|ega|egi|enge|ta|te|ti)\b\s*[.…]*$/i;
    const hasEnding = concludingPatterns.some(pat => pat.test(clean)) || suffixPattern.test(clean);
    if (!hasEnding) return true;
  }

  return false;
};

const getDeterministicIndex = (name, choicesCount) => {
  if (!name) return 0;
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  let h = 0;
  for (let i = 0; i < cleanName.length; i++) {
    h = (h * 31 + cleanName.charCodeAt(i)) & 0xFFFFFFFF;
  }
  const unsignedH = h >>> 0;
  return unsignedH % choicesCount;
};

const simulateMockReply = (userText, currentState, customerName, amount, bankName, unclearRetriesRef, amountDisclosedRef, alreadyPaidRef) => {
  const terminalStates = [
    'CALL_ENDED_SUCCESS', 'CALL_ENDED_REFUSED', 'CALL_ENDED_WRONG_NUMBER',
    'CALL_ENDED_UNCLEAR', 'CALL_ENDED_FINANCIAL', 'CALL_ENDED_CALLBACK',
    'PAYMENT_CONFIRM', 'CALL_ENDED_ESCALATED', 'CALL_ENDED_POLITE'
  ];

  if (isIncompleteThought(userText) && !terminalStates.includes(currentState)) {
    return {
      bot_text: "[continue_listening]",
      state: currentState,
      is_terminal: false,
      intent: 'UNCLEAR',
      emotion: 'Neutral',
      no_op: true
    };
  }

  let intent = detectIntent(userText, customerName);

  if (intent !== 'UNCLEAR' && intent !== 'SILENCE' && intent !== 'NOISE') {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
  }

  const idx = getDeterministicIndex(customerName, 3);

  // Global check for WRONG_PERSON intent in non-terminal states
  // Explicit wrong-number statements bypass retries entirely and terminate the call immediately
  if (intent === 'WRONG_PERSON' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    const botText = [
      "Oh sorry, lagta hai mujhe wrong number mil gaya. Maaf kijiye, dhanyavaad.",
      "Oh sorry, shayad number galat mil gaya hai. Disturb karne ke liye maaf kijiye, dhanyavaad.",
      "I am sorry, lagta hai yeh galat number hai. Maaf kijiye, dhanyavaad."
    ][idx];
    return {
      bot_text: botText,
      state: 'CALL_ENDED_WRONG_NUMBER',
      is_terminal: true,
      intent: intent,
      emotion: 'Apologetic'
    };
  }

  // Global check for AUDIO_CHECK intent in non-terminal states
  // Customer is saying they can't hear clearly — this is ACTIVE engagement.
  // Answer with identity + re-confirmation, do NOT end the call.
  if (intent === 'AUDIO_CHECK' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0; // Reset — this is NOT a silence
    return {
      bot_text: `Sorry for that, main ${bankName} Bank se bol raha hoon aapke pending due amount ke baare mein. Kya ab meri awaaz aapko clearly aa rahi hai?`,
      state: currentState, // stay in same state — re-confirm audio then continue
      is_terminal: false,
      intent: 'AUDIO_CHECK',
      emotion: 'Apologetic'
    };
  }

  // Global check for silence in non-terminal states
  if (intent === 'SILENCE' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) {
      unclearRetriesRef.current += 1;
      if (unclearRetriesRef.current > 3) {
        return {
          bot_text: "Lagta hai hamari aawaz nahi pahunch rahi hai. Hum aapse baad mein contact karenge. Dhanyavaad.",
          state: 'CALL_ENDED_UNCLEAR',
          is_terminal: true,
          intent: intent,
          emotion: 'Neutral'
        };
      } else {
        return {
          bot_text: "Hello? Kya aapko meri aawaz aa rahi hai? Kripya bataiye.",
          state: currentState,
          is_terminal: false,
          intent: intent,
          emotion: 'Confused'
        };
      }
    }
  }

  // Global check for noise in non-terminal states
  if (intent === 'NOISE' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) {
      unclearRetriesRef.current += 1;
      if (unclearRetriesRef.current > 1) {
        return {
          bot_text: "Lagta hai network kharab hai. Hum aapse baad mein contact karenge. Dhanyavaad.",
          state: 'CALL_ENDED_UNCLEAR',
          is_terminal: true,
          intent: intent,
          emotion: 'Neutral'
        };
      } else {
        return {
          bot_text: "Sorry, main aapki aawaz theek se nahi sun paya. Kya aap kripya repeat kar sakte hain?",
          state: currentState,
          is_terminal: false,
          intent: intent,
          emotion: 'Confused'
        };
      }
    }
  }

  // Global check for out of scope queries in non-terminal states
  if (intent === 'OUT_OF_SCOPE' && !terminalStates.includes(currentState)) {
    return {
      bot_text: "Maaf kijiye, main ek automated due amount recovery assistant hoon. Main sirf aapke pending due amount ke baare mein hi bata sakta hoon. Kripya due amount payment ke baare mein bataiye.",
      state: currentState,
      is_terminal: false,
      intent: intent,
      emotion: 'Polite'
    };
  }

  // Global check for wrong amount dispute in non-terminal states
  if (intent === 'WRONG_AMOUNT' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    if (amountDisclosedRef) amountDisclosedRef.current = true;
    return {
      bot_text: `Hamare bank records ke anusar aapka outstanding amount ₹${amount} hi hai. Kripya outstanding clear karein taaki koi penalty na lage. Kya main payment link bhej doon?`,
      state: 'WRONG_AMOUNT',
      is_terminal: false,
      intent: intent,
      emotion: 'Professional'
    };
  }

  // Global check for negotiation/discount in non-terminal states
  if (intent === 'NEGOTIATE' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    return {
      bot_text: "Maaf kijiye, bank policy ke anusar outstanding amount par koi discount, waiver ya settlement possible nahi hai. Aapko poora amount hi pay karna hoga. Kya main payment link bhej doon?",
      state: 'NEGOTIATE',
      is_terminal: false,
      intent: intent,
      emotion: 'Defensive'
    };
  }

  // Global check for due date question in non-terminal states
  if (intent === 'ASK_DUE_DATE' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    return {
      bot_text: "Aapki payment due date 15 June 2026 hai. Kya main aapko payment link bhej doon?",
      state: 'DUE_DATE',
      is_terminal: false,
      intent: intent,
      emotion: 'Professional'
    };
  }

  // Global check for bank name question in non-terminal states
  if (intent === 'ASK_BANK' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    const botText = [
      `Main ${bankName} bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon.`,
      `Main ${bankName} Bank se baat kar raha hoon. Agar aap abhi payment karna chahte hain, to main abhi link bhej deta hoon.`,
      `Ji main ${bankName} Bank se bol raha hoon. Agar aap payment karne ke liye taiyar hain, to main link WhatsApp ya SMS par bhej deta hoon.`
    ][idx];
    return {
      bot_text: botText,
      state: 'BANK_NAME',
      is_terminal: false,
      intent: intent,
      emotion: 'Inquisitive'
    };
  }

  // Global check for amount due question in non-terminal states
  if (intent === 'ASK_AMOUNT' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    if (amountDisclosedRef) amountDisclosedRef.current = true;
    const botText = [
      `Aapka ${amount} rupaye ka amount due hai hamare bank mein.`,
      `Aapka pending amount ₹${amount} due hai. Kripya isko clear karein.`,
      `Hamare records ke mutabik aapka ₹${amount} ka outstanding amount pending hai.`
    ][idx];
    return {
      bot_text: botText,
      state: 'AMOUNT_DUE',
      is_terminal: false,
      intent: intent,
      emotion: 'Cooperative'
    };
  }

  // Global check for callbacks in non-terminal states
  if (intent === 'CALLBACK' && currentState !== 'ASK_CALLBACK_TIME') {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    const extractedTime = extractCallbackTime(userText);
    if (extractedTime) {
      const botText = [
        `Maine aapka convenient callback time ${extractedTime} note kar liya hai. Hum aapko tabhi call karenge. Dhanyavaad!`,
        `Theek hai, maine schedule kar diya hai. Hum aapko ${extractedTime} par dobara contact karenge. Dhanyavaad!`,
        `Ji okay, maine ${extractedTime} ka time note kar liya hai. Hum aapko usi samay call karenge. Aapka din shubh ho!`
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_CALLBACK',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else {
      const botText = [
        "Aapko kis samay call karein? Taaki main convenient time note kar sakoon.",
        "Kripya mujhe ek convenient time bata dijiye jab main aapse dobara baat kar sakoon.",
        "Aap kis samay available rahenge call ke liye? Main wahi time note kar leta hoon."
      ][idx];
      return {
        bot_text: botText,
        state: 'ASK_CALLBACK_TIME',
        is_terminal: false,
        intent: intent,
        emotion: 'Inquisitive'
      };
    }
  }

  // Global check for ALREADY_PAID in non-terminal states
  if (intent === 'ALREADY_PAID' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    const dateIndicators = ["kal", "parso", "parson", "aaj", "subah", "shaam", "dopahar", "morning", "evening", "afternoon", "night", "raat", "yesterday", "today", "paid", "done", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "somwar", "mangalwar", "budhwar", "guruwar", "shukrawar", "shaniwar", "ravivar", "somvaar", "mangalvaar", "budhvaar", "guruvaar", "shukrawaar", "shaniwaar", "ravivaar", "कल", "परसों", "आज", "सुबह", "शाम", "दोपहर", "रात"];
    const hasDate = dateIndicators.some(word => userText.toLowerCase().includes(word)) || normalizeRelativeDate(userText) || extractSpecificDate(userText);
    if (hasDate) {
      if (alreadyPaidRef) alreadyPaidRef.current = true;
      const amountPrefix = (amountDisclosedRef && !amountDisclosedRef.current)
        ? [
            `Aapka ${amount} rupaye ka amount due hai hamare bank mein. `,
            `Aapka pending amount ₹${amount} due hai. `,
            `Hamare records ke mutabik aapka ₹${amount} ka outstanding amount pending hai. `
          ][idx]
        : "";
      if (amountDisclosedRef) amountDisclosedRef.current = true;
      const botText = amountPrefix + [
        "Achha, theek hai. Maine note kar liya hai ki aapne payment kar diya hai. Main hamare records mein check kar leta hoon. Dhanyavaad.",
        "Ji theek hai, maine note kar liya hai ki aapne payment kar diya hai. Hum records verify kar lenge. Dhanyavaad.",
        "Theek hai, aapki payment details maine mark kar li hain. Main system mein update kar deta hoon. Dhanyavaad."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_SUCCESS',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else {
      const botText = [
        "Achha, aapne kab pay kiya tha? Main system mein check kar leta hoon.",
        "Achha theek hai, kripya mujhe payment ki date bata dijiye taaki main check kar sakoon.",
        "Achha okay, aapne kis tareekh ko payment kiya tha? Main system mein verify kar leta hoon."
      ][idx];
      return {
        bot_text: botText,
        state: 'ALREADY_PAID',
        is_terminal: false,
        intent: intent,
        emotion: 'Cooperative'
      };
    }
  }

  // Global check for financial problem in non-terminal states
  if (intent === 'FINANCIAL_PROBLEM' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    const botText = [
      "Oh, mujhe sunkar dukh hua. Main samajh sakta hoon ki aap abhi financial problem mein hain. Main system mein mark kar deta hoon ki aap abhi pay nahi kar sakte. Hum aapse baad mein contact karenge. Dhanyavaad, apna khayal rakhiyega.",
      "Oh, I am sorry to hear that. Main samajh sakta hoon ki pareshani hai. Main record mein mark kar deta hoon ki abhi payment possible nahi hai. Hum baad mein connect karenge. Dhanyavaad aur apna khayal rakhein.",
      "Dukh hua sunkar. Pareshani ki wajah se main ise system mein note kar leta hoon. Hum aapse baad mein contact karenge. Dhanyavaad, apna dhyaan rakhiyega."
    ][idx];
    return {
      bot_text: botText,
      state: 'CALL_ENDED_FINANCIAL',
      is_terminal: true,
      intent: intent,
      emotion: 'Apologetic'
    };
  }

  // Global check for promise to pay in non-terminal states
  if (intent === 'PROMISE_TO_PAY' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    const normalizedDate = normalizeRelativeDate(userText) || extractSpecificDate(userText);
    if (normalizedDate) {
      const amountPrefix = (amountDisclosedRef && !amountDisclosedRef.current)
        ? [
            `Aapka ${amount} rupaye ka amount due hai hamare bank mein. `,
            `Aapka pending amount ₹${amount} due hai. `,
            `Hamare records ke mutabik aapka ₹${amount} ka outstanding amount pending hai. `
          ][idx]
        : "";
      if (amountDisclosedRef) amountDisclosedRef.current = true;
      const botText = amountPrefix + [
        `Maine aapki payment ${normalizedDate} ke liye note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad.`,
        `Theek hai, maine check kiya aur aapki payment date ${normalizedDate} system mein mark kar li hai. Kripya yaad se pay kar dijiye. Dhanyavaad.`,
        `Ji theek hai, maine ${normalizedDate} ko aapki payment ki commitment note kar li hai. Samay par bhugtan kar dijiye. Dhanyavaad.`
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_SUCCESS',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else {
      const botText = [
        'Aap kis date ko pay karenge? Taaki main system mein note kar sakoon.',
        'Kripya mujhe date bata dijiye jab aap pay karenge, taaki main entry kar loon.',
        'Aap kis tareekh tak payment kar denge? Main uski entry system mein kar deta hoon.'
      ][idx];
      return {
        bot_text: botText,
        state: 'ASK_PAYMENT_DATE',
        is_terminal: false,
        intent: intent,
        emotion: 'Inquisitive'
      };
    }
  }

  // Global check for angry / abusive in non-terminal states
  if ((intent === 'ANGRY' || intent === 'ABUSIVE') && !terminalStates.includes(currentState)) {
    const botText = (currentState === 'DE_ESCALATE')
      ? [
          "Koi baat nahi, hum aapse dobara contact karenge. Dhanyavaad.",
          "Theek hai, koi baat nahi. Hum baad mein baat karenge. Dhanyavaad.",
          "Okay, main samajh gaya. Hum aapse baad mein contact karenge. Dhanyavaad."
        ][idx]
      : [
          "Maaf kijiye, hum aapko pareshan nahi karna chahte. Agar aap abhi payment nahi kar sakte to koi baat nahi.",
          "Maaf kijiye, hamara maksad aapko pareshan karna nahi tha. Agar payment abhi nahi ho sakti to hum baad mein contact kar lenge.",
          "I am sorry, hum aapko disturb nahi karna chahte. Agar abhi payment possible nahi hai to koi baat nahi."
        ][idx];
    return {
      bot_text: botText,
      state: (currentState === 'DE_ESCALATE') ? 'CALL_ENDED_REFUSED' : 'DE_ESCALATE',
      is_terminal: (currentState === 'DE_ESCALATE'),
      intent: intent,
      emotion: (currentState === 'DE_ESCALATE') ? 'Defensive' : 'Apologetic'
    };
  }

  // Global check for sensitive queries in non-terminal states
  if (intent === 'ASK_SENSITIVE') {
    return {
      bot_text: `Security reasons ki wajah se main aapka PAN number ya account number call par nahi bata sakta. Main ${bankName} Bank se bol raha hoon. Agar aap pay kar rahe hain to kya main aapko payment link bhej doon?`,
      state: 'BANK_NAME',
      is_terminal: false,
      intent: intent,
      emotion: 'Defensive'
    };
  }

  // Global check for human agent request in non-terminal states
  if (intent === 'HUMAN_AGENT' && !terminalStates.includes(currentState)) {
    const botText = [
      "Hum samajh sakte hain. Main aapki call hamare senior representative ya manager ko transfer kar raha hoon. Kripya line par bane rahein. Dhanyavaad.",
      "Ji main samajh raha hoon. Main aapki call senior department ya manager ko forward kar raha hoon. Kripya line hold kijiye. Dhanyavaad.",
      "Theek hai. Is vishay par baat karne ke liye main call manager ko connect kar raha hoon. Kripya line par bane rahein. Dhanyavaad."
    ][idx];
    return {
      bot_text: botText,
      state: 'CALL_ENDED_ESCALATED',
      is_terminal: true,
      intent: intent,
      emotion: 'Professional'
    };
  }

  // Global check for GOODBYE in non-terminal states
  if (intent === 'GOODBYE' && !terminalStates.includes(currentState)) {
    return {
      bot_text: "Aapka dhanyavaad! Agar kabhi zaroorat ho to hum yahan hain. Aapka din shubh ho. Alvida!",
      state: 'CALL_ENDED_POLITE',
      is_terminal: true,
      intent: intent,
      emotion: 'Warm'
    };
  }

  // Global check for MAYBE in non-terminal states
  if (intent === 'MAYBE' && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) unclearRetriesRef.current = 0;
    return {
      bot_text: "Theek hai, kya aap chahte hain ki main aapko kal reminder call karoon? Isse aapko payment yaad rahega.",
      state: 'REMINDER_ASKED',
      is_terminal: false,
      intent: intent,
      emotion: 'Helpful'
    };
  }

  // Rule 4: If confidence on intent classification is below 90%, do not advance state
  const confidence = (intent === 'UNCLEAR') ? 0.5 : 1.0;
  if (confidence < 0.9 && !terminalStates.includes(currentState)) {
    if (unclearRetriesRef) {
      unclearRetriesRef.current += 1;
      if (unclearRetriesRef.current > 2) {
        return {
          bot_text: "Lagta hai hamari aawaz nahi pahunch rahi hai. Hum aapse baad mein contact karenge. Dhanyavaad.",
          state: 'CALL_ENDED_UNCLEAR',
          is_terminal: true,
          intent: 'UNCLEAR',
          emotion: 'Neutral'
        };
      }
    }
    return {
      bot_text: "Sorry, aapne kya kaha, dobara bata sakte hain?",
      state: currentState,
      is_terminal: false,
      intent: 'UNCLEAR',
      emotion: 'Confused'
    };
  }

  if (currentState === 'GREETING' || currentState === 'GREETING_IDENTITY_ASKED') {
    if (intent === 'ASK_IDENTITY' || intent === 'ASK_BANK') {
      const botText = [
        `Main ${bankName} Bank se bol raha hoon. Yeh call aapke pending personal due amount ke payment ke baare mein hai. Kya meri baat ${customerName} se ho rahi hai?`,
        `Ji main ${bankName} Bank se baat kar raha hoon aapke pending due ke silsile mein. Kya meri baat ${customerName} ji se ho rahi hai?`,
        `Main ${bankName} Bank se bol raha hoon aapke due amount ke regarding. Kya main ${customerName} ji se baat kar sakta hoon?`
      ][idx];
      return {
        bot_text: botText,
        state: 'GREETING_IDENTITY_ASKED',
        is_terminal: false,
        intent: intent,
        emotion: 'Inquisitive'
      };
    } else if (intent === 'FINANCIAL_PROBLEM') {
      const botText = [
        "Oh, mujhe sunkar dukh hua. Main samajh sakta hoon ki aap abhi financial problem mein hain. Main system mein mark kar deta hoon ki aap abhi pay nahi kar sakte. Hum aapse baad mein contact karenge. Dhanyavaad, apna khayal rakhiyega.",
        "Oh, I am sorry to hear that. Main samajh sakta hoon ki pareshani hai. Main record mein mark kar deta hoon ki abhi payment possible nahi hai. Hum baad mein connect karenge. Dhanyavaad aur apna khayal rakhein.",
        "Dukh hua sunkar. Pareshani ki wajah se main ise system mein note kar leta hoon. Hum aapse baad mein contact karenge. Dhanyavaad, apna dhyaan rakhiyega."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_FINANCIAL',
        is_terminal: true,
        intent: intent,
        emotion: 'Apologetic'
      };
    } else if (intent === 'ASK_AMOUNT' || intent === 'ASK_LINK' || intent === 'AFFIRM' || intent === 'ACKNOWLEDGE') {
      if (amountDisclosedRef) amountDisclosedRef.current = true;
      const botText = [
        `Aapka ${amount} rupaye ka amount due hai hamare bank mein.`,
        `Aapka pending amount ₹${amount} due hai. Kripya isko clear karein.`,
        `Hamare records ke mutabik aapka ₹${amount} ka outstanding amount pending hai.`
      ][idx];
      return {
        bot_text: botText,
        state: 'AMOUNT_DUE',
        is_terminal: false,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'DENY' || intent === 'WRONG_PERSON') {
      const botText = [
        `Achha okay. Kya meri baat ${customerName} ji se ho sakti hai? Main ${bankName} Bank se bol raha hoon.`,
        `Theek hai. Kya aap meri baat ${customerName} ji se karwa sakte hain? Main ${bankName} Bank se bol raha hoon.`,
        `Achha, to kya ${customerName} ji ghar par hain? Unse baat karwa dijiye please, main ${bankName} Bank se bol raha hoon.`
      ][idx];
      return {
        bot_text: botText,
        state: 'ASK_JITESH',
        is_terminal: false,
        intent: intent,
        emotion: 'Neutral'
      };
    } else {
      return {
        bot_text: 'Sorry, main samajh nahi paya. Kya aap haan ya nahi mein bata sakte hain?',
        state: currentState,
        is_terminal: false,
        intent: 'UNCLEAR',
        emotion: 'Confused'
      };
    }
  }

  if (currentState === 'ASK_JITESH') {
    if (intent === 'AFFIRM' || intent === 'ACKNOWLEDGE') {
      if (amountDisclosedRef) amountDisclosedRef.current = true;
      const botText = [
        `Aapka ${amount} rupaye ka amount due hai hamare bank mein.`,
        `Aapka pending amount ₹${amount} due hai. Kripya isko clear karein.`,
        `Hamare records ke mutabik aapka ₹${amount} ka outstanding amount pending hai.`
      ][idx];
      return {
        bot_text: botText,
        state: 'AMOUNT_DUE',
        is_terminal: false,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'DENY' || intent === 'WRONG_PERSON') {
      const botText = [
        "Oh sorry, lagta hai mujhe wrong number mil gaya. Maaf kijiye, dhanyavaad.",
        "Oh sorry, shayad number galat mil gaya hai. Disturb karne ke liye maaf kijiye, dhanyavaad.",
        "I am sorry, lagta hai yeh galat number hai. Maaf kijiye, dhanyavaad."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_WRONG_NUMBER',
        is_terminal: true,
        intent: intent,
        emotion: 'Neutral'
      };
    } else {
      return {
        bot_text: 'Sorry, main samajh nahi paya. Kya aap haan ya nahi mein bata sakte hain?',
        state: 'ASK_JITESH',
        is_terminal: false,
        intent: 'UNCLEAR',
        emotion: 'Confused'
      };
    }
  }

  if (currentState === 'AMOUNT_DUE' || currentState === 'DE_ESCALATE') {
    if (intent === 'ASK_IDENTITY' || intent === 'ASK_BANK') {
      const botText = [
        `Main ${bankName} bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon.`,
        `Main ${bankName} Bank se baat kar raha hoon. Agar aap abhi payment karna chahte hain, to main abhi link bhej deta hoon.`,
        `Ji main ${bankName} Bank se bol raha hoon. Agar aap payment karne ke liye taiyar hain, to main link WhatsApp ya SMS par bhej deta hoon.`
      ][idx];
      return {
        bot_text: botText,
        state: 'BANK_NAME',
        is_terminal: false,
        intent: intent,
        emotion: 'Inquisitive'
      };
    } else if (intent === 'ALREADY_PAID') {
      const botText = [
        "Achha, aapne kab pay kiya tha? Main system mein check kar leta hoon.",
        "Achha theek hai, kripya mujhe payment ki date bata dijiye taaki main check kar sakoon.",
        "Achha okay, aapne kis tareekh ko payment kiya tha? Main system mein verify kar leta hoon."
      ][idx];
      return {
        bot_text: botText,
        state: 'ALREADY_PAID',
        is_terminal: false,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'FINANCIAL_PROBLEM') {
      const botText = [
        "Oh, mujhe sunkar dukh hua. Main samajh sakta hoon ki aap abhi financial problem mein hain. Main system mein mark kar deta hoon ki aap abhi pay nahi kar sakte. Hum aapse baad mein contact karenge. Dhanyavaad, apna khayal rakhiyega.",
        "Oh, I am sorry to hear that. Main samajh sakta hoon ki pareshani hai. Main record mein mark kar deta hoon ki abhi payment possible nahi hai. Hum baad mein connect karenge. Dhanyavaad aur apna khayal rakhein.",
        "Dukh hua sunkar. Pareshani ki wajah se main ise system mein note kar leta hoon. Hum aapse baad mein contact karenge. Dhanyavaad, apna dhyaan rakhiyega."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_FINANCIAL',
        is_terminal: true,
        intent: intent,
        emotion: 'Apologetic'
      };
    } else if (intent === 'ASK_LINK') {
      const botText = [
        "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!",
        "Sure, payment link aapke number par send kar diya hai. Kripya check kijiye aur pay kar dijiye. Dhanyavaad!",
        "Theek hai, link aapko send ho gaya hai. Aap usse abhi pay kar sakte hain. Bahut-bahut dhanyavaad!"
      ][idx];
      return {
        bot_text: botText,
        state: 'PAYMENT_CONFIRM',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'AFFIRM' || intent === 'ACKNOWLEDGE') {
      const linkKeywords = ["link", "bhej", "send", "whatsapp", "sms", "message", "qr", "upi", "paytm", "gpay", "phonepe"];
      const hasLinkKW = linkKeywords.some(kw => userText.toLowerCase().includes(kw));
      if (hasLinkKW) {
        const botText = [
          "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!",
          "Sure, payment link aapke number par send kar diya hai. Kripya check kijiye aur pay kar dijiye. Dhanyavaad!",
          "Theek hai, link aapko send ho gaya hai. Aap usse abhi pay kar sakte hain. Bahut-bahut dhanyavaad!"
        ][idx];
        return {
          bot_text: botText,
          state: 'PAYMENT_CONFIRM',
          is_terminal: true,
          intent: 'AFFIRM',
          emotion: 'Cooperative'
        };
      } else {
        const botText = [
          `Main ${bankName} bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon.`,
          `Main ${bankName} Bank se baat kar raha hoon. Agar aap abhi payment karna chahte hain, to main abhi link bhej deta hoon.`,
          `Ji main ${bankName} Bank se bol raha hoon. Agar aap payment karne ke liye taiyar hain, to main link WhatsApp ya SMS par bhej deta hoon.`
        ][idx];
        return {
          bot_text: botText,
          state: 'BANK_NAME',
          is_terminal: false,
          intent: 'AFFIRM',
          emotion: 'Cooperative'
        };
      }
    } else if (intent === 'DENY') {
      const botText = [
        "Koi baat nahi, hum aapse dobara contact karenge. Dhanyavaad.",
        "Theek hai, koi baat nahi. Hum baad mein baat karenge. Dhanyavaad.",
        "Okay, main samajh gaya. Hum aapse baad mein contact karenge. Dhanyavaad."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_REFUSED',
        is_terminal: true,
        intent: 'DENY',
        emotion: 'Defensive'
      };
    } else {
      return {
        bot_text: 'Sorry, main samajh nahi paya. Kya aap haan ya nahi mein bata sakte hain?',
        state: currentState,
        is_terminal: false,
        intent: 'UNCLEAR',
        emotion: 'Neutral'
      };
    }
  }

  if (currentState === 'BANK_NAME') {
    if (intent === 'AFFIRM' || intent === 'ACKNOWLEDGE' || intent === 'ASK_LINK') {
      const botText = [
        "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!",
        "Sure, payment link aapke number par send kar diya hai. Kripya check kijiye aur pay kar dijiye. Dhanyavaad!",
        "Theek hai, link aapko send ho gaya hai. Aap usse abhi pay kar sakte hain. Bahut-bahut dhanyavaad!"
      ][idx];
      return {
        bot_text: botText,
        state: 'PAYMENT_CONFIRM',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'DENY') {
      const botText = [
        "Koi baat nahi, hum aapse dobara contact karenge. Dhanyavaad.",
        "Theek hai, koi baat nahi. Hum baad mein baat karenge. Dhanyavaad.",
        "Okay, main samajh gaya. Hum aapse baad mein contact karenge. Dhanyavaad."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_REFUSED',
        is_terminal: true,
        intent: 'DENY',
        emotion: 'Defensive'
      };
    } else {
      return {
        bot_text: 'Sorry, main samajh nahi paya. Kya aap haan ya nahi mein bata sakte hain?',
        state: 'BANK_NAME',
        is_terminal: false,
        intent: 'UNCLEAR',
        emotion: 'Confused'
      };
    }
  }

  if (currentState === 'ASK_PAYMENT_DATE') {
    if (intent === 'DENY') {
      const botText = [
        "Koi baat nahi, hum aapse dobara contact karenge. Dhanyavaad.",
        "Theek hai, koi baat nahi. Hum baad mein baat karenge. Dhanyavaad.",
        "Okay, main samajh gaya. Hum aapse baad mein contact karenge. Dhanyavaad."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_REFUSED',
        is_terminal: true,
        intent: intent,
        emotion: 'Defensive'
      };
    }
    const normalizedDate = normalizeRelativeDate(userText) || extractSpecificDate(userText);
    const botText = normalizedDate 
      ? [
          `Maine aapki payment ${normalizedDate} ke liye note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad.`,
          `Theek hai, maine check kiya aur aapki payment date ${normalizedDate} system mein mark kar li hai. Kripya yaad se pay kar dijiye. Dhanyavaad.`,
          `Ji theek hai, maine ${normalizedDate} ko aapki payment ki commitment note kar li hai. Samay par bhugtan kar dijiye. Dhanyavaad.`
        ][idx]
      : [
          "Theek hai, maine aapki payment commitment note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad.",
          "Achha theek hai, maine aapki commitment note kar li hai. Kripya time par pay kar dijiye. Dhanyavaad.",
          "Ji, maine aapki payment commitment system mein register kar li hai. Dhanyavaad."
        ][idx];
    return {
      bot_text: botText,
      state: 'CALL_ENDED_SUCCESS',
      is_terminal: true,
      intent: intent,
      emotion: 'Cooperative'
    };
  }

  if (currentState === 'ASK_CALLBACK_TIME') {
    if (intent === 'DENY') {
      const botText = [
        "Koi baat nahi, hum aapse dobara contact karenge. Dhanyavaad.",
        "Theek hai, koi baat nahi. Hum baad mein baat karenge. Dhanyavaad.",
        "Okay, main samajh gaya. Hum aapse baad mein contact karenge. Dhanyavaad."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_REFUSED',
        is_terminal: true,
        intent: intent,
        emotion: 'Defensive'
      };
    }
    const extractedTime = extractCallbackTime(userText);
    if (extractedTime) {
      const botText = [
        `Maine aapka convenient callback time ${extractedTime} note kar liya hai. Hum aapko tabhi call karenge. Dhanyavaad!`,
        `Theek hai, maine schedule kar diya hai. Hum aapko ${extractedTime} par dobara contact karenge. Dhanyavaad!`,
        `Ji okay, maine ${extractedTime} ka time note kar liya hai. Hum aapko usi samay call karenge. Aapka din shubh ho!`
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_CALLBACK',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else {
      return {
        bot_text: "Theek hai. Aapko kis samay call karna zyada convenient rahega?",
        state: 'ASK_CALLBACK_TIME',
        is_terminal: false,
        intent: intent,
        emotion: 'Inquisitive'
      };
    }
  }

  if (currentState === 'ALREADY_PAID') {
    if (alreadyPaidRef) alreadyPaidRef.current = true;
    const botText = [
      "Achha, theek hai. Maine note kar liya hai ki aapne payment kar diya hai. Main hamare records mein check kar leta hoon. Dhanyavaad.",
      "Ji theek hai, maine note kar liya hai ki aapne payment kar diya hai. Hum records verify kar lenge. Dhanyavaad.",
      "Theek hai, aapki payment details maine mark kar li hain. Main system mein update kar deta hoon. Dhanyavaad."
    ][idx];
    return {
      bot_text: botText,
      state: 'CALL_ENDED_SUCCESS',
      is_terminal: true,
      intent: intent,
      emotion: 'Neutral'
    };
  }

  if (currentState === 'DUE_DATE' || currentState === 'WRONG_AMOUNT' || currentState === 'NEGOTIATE') {
    if (intent === 'AFFIRM' || intent === 'ACKNOWLEDGE' || intent === 'ASK_LINK') {
      const botText = [
        "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!",
        "Sure, payment link aapke number par send kar diya hai. Kripya check kijiye aur pay kar dijiye. Dhanyavaad!",
        "Theek hai, link aapko send ho gaya hai. Aap usse abhi pay kar sakte hain. Bahut-bahut dhanyavaad!"
      ][idx];
      return {
        bot_text: botText,
        state: 'PAYMENT_CONFIRM',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'DENY') {
      const botText = [
        "Koi baat nahi, hum aapse dobara contact karenge. Dhanyavaad.",
        "Theek hai, koi baat nahi. Hum baad mein baat karenge. Dhanyavaad.",
        "Okay, main samajh gaya. Hum aapse baad mein contact karenge. Dhanyavaad."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_REFUSED',
        is_terminal: true,
        intent: 'DENY',
        emotion: 'Defensive'
      };
    } else {
      return {
        bot_text: 'Sorry, main samajh nahi paya. Kya aap haan ya nahi mein bata sakte hain?',
        state: currentState,
        is_terminal: false,
        intent: 'UNCLEAR',
        emotion: 'Confused'
      };
    }
  }

  // REMINDER_ASKED state handler
  if (currentState === 'REMINDER_ASKED') {
    if (intent === 'AFFIRM' || intent === 'ACKNOWLEDGE') {
      return {
        bot_text: 'Theek hai, maine kal ke liye aapka reminder register kar liya hai. Dhanyavaad, hum call karenge!',
        state: 'CALL_ENDED_CALLBACK',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'DENY') {
      return {
        bot_text: 'Samajh sakta hoon. Lekin aapko bata dena chahta hoon ki payment na karne par late fees aur credit score par asar pad sakta hai. Kya aap kal tak payment kar sakte hain?',
        state: 'CONSEQUENCES_EXPLAINED',
        is_terminal: false,
        intent: intent,
        emotion: 'Informative'
      };
    } else {
      return {
        bot_text: 'Sorry, main samajh nahi paya. Kya aap reminder chahte hain? Haan ya nahi mein bataiye.',
        state: 'REMINDER_ASKED',
        is_terminal: false,
        intent: 'UNCLEAR',
        emotion: 'Confused'
      };
    }
  }

  // CONSEQUENCES_EXPLAINED state handler
  if (currentState === 'CONSEQUENCES_EXPLAINED') {
    if (intent === 'AFFIRM' || intent === 'ACKNOWLEDGE' || intent === 'ASK_LINK') {
      const botText = [
        "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!",
        "Sure, payment link aapke number par send kar diya hai. Kripya check kijiye aur pay kar dijiye. Dhanyavaad!",
        "Theek hai, link aapko send ho gaya hai. Aap usse abhi pay kar sakte hain. Bahut-bahut dhanyavaad!"
      ][idx];
      return {
        bot_text: botText,
        state: 'PAYMENT_CONFIRM',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'PROMISE_TO_PAY') {
      const normalizedDate = normalizeRelativeDate(userText) || extractSpecificDate(userText);
      const botText = normalizedDate 
        ? [
            `Maine aapki payment ${normalizedDate} ke liye note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad.`,
            `Theek hai, maine check kiya aur aapki payment date ${normalizedDate} system mein mark kar li hai. Kripya yaad se pay kar dijiye. Dhanyavaad.`,
            `Ji theek hai, maine ${normalizedDate} ko aapki payment ki commitment note kar li hai. Samay par bhugtan kar dijiye. Dhanyavaad.`
          ][idx]
        : [
            "Theek hai, maine aapki payment commitment note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad.",
            "Achha theek hai, maine aapki commitment note kar li hai. Kripya time par pay kar dijiye. Dhanyavaad.",
            "Ji, maine aapki payment commitment system mein register kar li hai. Dhanyavaad."
          ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_SUCCESS',
        is_terminal: true,
        intent: intent,
        emotion: 'Cooperative'
      };
    } else if (intent === 'DENY' || intent === 'MAYBE') {
      const botText = [
        "Koi baat nahi, hum aapse dobara contact karenge. Aapka dhanyavaad.",
        "Theek hai, koi baat nahi. Hum baad mein baat karenge. Dhanyavaad.",
        "Okay, main samajh gaya. Hum aapse baad mein contact karenge. Dhanyavaad."
      ][idx];
      return {
        bot_text: botText,
        state: 'CALL_ENDED_REFUSED',
        is_terminal: true,
        intent: intent,
        emotion: 'Professional'
      };
    } else {
      return {
        bot_text: 'Sorry, main samajh nahi paya. Kya aap kal tak payment kar sakte hain?',
        state: 'CONSEQUENCES_EXPLAINED',
        is_terminal: false,
        intent: 'UNCLEAR',
        emotion: 'Confused'
      };
    }
  }

  const botText = [
    "Theek hai, main baad mein call karta hoon. Dhanyavaad.",
    "Lagta hai network issues hain. Hum baad mein contact karenge. Dhanyavaad.",
    "Awaaz theek se nahi aa rahi hai. Hum baad mein call karenge. Dhanyavaad."
  ][idx];
  return {
    bot_text: botText,
    state: 'CALL_ENDED_UNCLEAR',
    is_terminal: true,
    intent: 'UNCLEAR',
    emotion: 'Neutral'
  };
};

const validateName = (name) => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return "Name cannot be empty.";
  }
  if (trimmed.length < 2) {
    return "Name must be at least 2 characters long.";
  }
  if (trimmed.length >= 150) {
    return "Name must be less than 150 characters.";
  }
  
  // Reject numbers
  if (/\d/.test(trimmed)) {
    return "Name cannot contain numbers.";
  }
  
  // Check for allowed characters: English letters, Devanagari letters, spaces, dots, hyphens
  const nameRegex = /^[A-Za-z\s\u0900-\u097F\.\-]+$/;
  if (!nameRegex.test(trimmed)) {
    return "Name cannot contain special characters.";
  }
  
  return null;
};

const validateAmount = (amountStr) => {
  const trimmed = amountStr ? String(amountStr).trim() : "";
  
  if (!trimmed) {
    return "Due amount cannot be empty.";
  }
  
  const num = Number(trimmed);
  if (isNaN(num)) {
    return "Due amount must be a valid number.";
  }
  
  if (num < 0) {
    return "Due amount cannot be negative.";
  }
  
  if (num === 0) {
    return "Due amount must be greater than 0.";
  }
  
  // Check if it's a decimal (contains fractional part)
  if (!Number.isInteger(num)) {
    return "Due amount must be a whole number (decimals are not supported).";
  }
  
  if (num > 50000000) {
    return "Due amount cannot exceed ₹50,000,000.";
  }
  
  return null;
};

const validateBank = (bank) => {
  const trimmed = bank ? String(bank).trim() : "";
  
  if (!trimmed) {
    return "Bank name cannot be empty.";
  }
  
  // Reject numbers
  if (/\d/.test(trimmed)) {
    return "Bank name cannot contain numbers.";
  }
  
  // Check for allowed characters: English letters, Devanagari letters, spaces, dots, hyphens, and ampersands
  const bankRegex = /^[A-Za-z\s\u0900-\u097F\.\-&]+$/;
  if (!bankRegex.test(trimmed)) {
    return "Bank name cannot contain special characters.";
  }
  
  return null;
};

const validatePhone = (phoneStr) => {
  const cleaned = phoneStr ? String(phoneStr).replace(/\s+/g, '') : "";
  
  if (!cleaned) {
    return "Phone number cannot be empty.";
  }
  
  // Reject letters
  if (/[A-Za-z]/.test(cleaned)) {
    return "Phone number cannot contain letters.";
  }
  
  // Reject any special character other than leading '+'
  const isSpecialChar = /[^\d]/.test(cleaned.startsWith('+') ? cleaned.slice(1) : cleaned);
  if (isSpecialChar) {
    return "Phone number cannot contain special characters.";
  }
  
  // Validate country code and digit count
  if (cleaned.startsWith('+')) {
    if (!cleaned.startsWith('+91')) {
      return "Invalid country code. Only +91 is supported.";
    }
    const digitsPart = cleaned.slice(3);
    if (digitsPart.length < 10) {
      return "Phone number must be at least 10 digits.";
    }
    if (digitsPart.length > 10) {
      return "Phone number cannot exceed 10 digits.";
    }
  } else {
    if (cleaned.length < 10) {
      return "Phone number must be at least 10 digits.";
    }
    if (cleaned.length > 10) {
      return "Phone number cannot exceed 10 digits.";
    }
  }
  
  return null;
};

const validateDate = (dateStr) => {
  const trimmed = dateStr ? String(dateStr).trim() : "";
  
  if (!trimmed) {
    return { error: "Due date cannot be empty.", warning: null };
  }
  
  const parsedDate = new Date(trimmed);
  if (isNaN(parsedDate.getTime())) {
    return { error: "Invalid date format. Please enter a valid date.", warning: null };
  }
  
  // Get today's date (ignoring time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Set parsed date time to midnight for exact date comparison
  const compareDate = new Date(parsedDate);
  compareDate.setHours(0, 0, 0, 0);
  
  if (compareDate.getTime() < today.getTime()) {
    return { error: null, warning: "Warning: Due date is in the past." };
  }
  
  return { error: null, warning: null };
};

export default function VoiceBot() {
  // Global theme state (defaults to true for dark mode, can toggle to false for light mode)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Global Mock Mode state
  const [isMockMode, setIsMockMode] = useState(() => {
    if (window.MOCK_API !== undefined) return window.MOCK_API === true;
    if (import.meta.env.VITE_MOCK_API !== undefined) return import.meta.env.VITE_MOCK_API === 'true';
    return false;
  });

  // Client Details Input States
  const [customerName, setCustomerName] = useState('Mahima Dangi');
  const [amount, setAmount] = useState('5000');
  const [bankName, setBankName] = useState('ICICI');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [dueId, setDueId] = useState('LN-9830219');
  const [dueDate, setDueDate] = useState('June 15, 2026');
  const [nameError, setNameError] = useState(null);
  const [amountError, setAmountError] = useState(null);
  const [bankError, setBankError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);
  const [dateError, setDateError] = useState(null);
  const [dateWarning, setDateWarning] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Voice engine and voice settings
  const [voiceEngine, setVoiceEngine] = useState('sarvam'); // 'sarvam' | 'gtts'
  const [voiceGender, setVoiceGender] = useState('male'); // 'male' | 'female'

  // Call status
  const [sessionId, setSessionId] = useState(null);
  const [isCallActive, _setIsCallActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentState, setCurrentState] = useState('GREETING');
  const [isTerminal, setIsTerminal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Payment link state
  const [paymentLink, setPaymentLink] = useState('');
  const [paymentLinkSent, setPaymentLinkSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audio / Speech State
  const [isSpeaking, _setIsSpeaking] = useState(false);
  const [isListening, _setIsListening] = useState(false);
  const [isThinking, _setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, _setIsOnHold] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);
  const [agentEmotion, setAgentEmotion] = useState('Empathetic');
  const [userMetadata, setUserMetadata] = useState({ intent: 'NONE', emotion: 'Neutral', confidence: 100 });

  // Call summary states
  const [callSummary, setCallSummary] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Refs
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);
  const isTerminalRef = useRef(false);
  const utteranceRef = useRef(null);
  const sessionIdRef = useRef(null);
  const currentStateRef = useRef('GREETING');
  const isMockModeRef = useRef(false);
  const pendingTerminalStateRef = useRef(null);
  const isCallActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const isOnHoldRef = useRef(false);
  const isListeningRef = useRef(false);
  const hasMicErrorRef = useRef(false);
  const intentionalAbortRef = useRef(false);
  const consecutiveSpeechErrorsRef = useRef(0);
  const isMutedRef = useRef(false);
  const lastBotSpokenTextRef = useRef('');
  const unclearRetriesRef = useRef(0);
  const amountDisclosedRef = useRef(false);
  const alreadyPaidRef = useRef(false);
  // Processing lock — prevents duplicate turns from overlapping
  const isProcessingTurnRef = useRef(false);
  // Silence detection — count how many consecutive no-speech events occurred while not speaking
  const silenceCountRef = useRef(0);
  // Retry tracking for API failures
  const apiRetryCountRef = useRef(0);
  const MAX_API_RETRIES = 2;
  // Max consecutive silence/unclear turns before ending call gracefully (applies to BOTH mock and real mode)
  // 3 retries = 3 prompt attempts ("hello? kya sunaai de raha hai?") before giving up
  // Each STT no-speech window is ~3s, so 3 retries ≈ 9-10s of real wait time
  const MAX_SILENCE_RETRIES = 3;
  // Hard safety timeout: if no speech detected for this many ms, end the call
  // 30s gives plenty of time even with slow speakers and long bot utterances
  const NO_SPEECH_TIMEOUT_MS = 30000;
  const noSpeechTimerRef = useRef(null); // Tracks the hard safety timeout handle
  const lastSpeechTimeRef = useRef(Date.now()); // Tracks when user last spoke
  // Store latest handleUserMessage in ref to avoid stale closure in recognition callbacks
  const handleUserMessageRef = useRef(null);
  const turnTimerRef = useRef(null);
  const transcriptBufferRef = useRef('');

  // Remapped setter functions for synchronous updates to both state and refs
  const setIsCallActive = (val) => {
    _setIsCallActive(val);
    isCallActiveRef.current = val;
  };
  const setIsSpeaking = (val) => {
    _setIsSpeaking(val);
    isSpeakingRef.current = val;
  };
  const setIsThinking = (val) => {
    _setIsThinking(val);
    isThinkingRef.current = val;
  };
  const setIsOnHold = (val) => {
    _setIsOnHold(val);
    isOnHoldRef.current = val;
  };
  const setIsListening = (val) => {
    _setIsListening(val);
    isListeningRef.current = val;
  };

  // Sync refs to bypass stale closures
  useEffect(() => {
    isTerminalRef.current = isTerminal;
  }, [isTerminal]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    isMockModeRef.current = isMockMode;
  }, [isMockMode]);

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    isOnHoldRef.current = isOnHold;
  }, [isOnHold]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Live Timer Effect
  useEffect(() => {
    let timer = null;
    if (isCallActive && !isTerminal && !isOnHold) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallActive, isTerminal, isOnHold]);

  // Format Duration seconds to MM:SS or HH:MM:SS
  const formatTimer = (totalSecs) => {
    if (totalSecs < 0 || isNaN(totalSecs)) return "00:00";
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSummaryDuration = (totalSecs, finalState) => {
    const formatted = formatTimer(totalSecs);
    if (finalState === 'CALL_FAILED') {
      return `${formatted} (Failed Call)`;
    }
    if (totalSecs === 0) {
      if (finalState === 'CALL_ENDED_UNCLEAR' || finalState === 'CALL_ENDED_WRONG_NUMBER') {
        return "00:00 (Not Connected)";
      }
      return "00:00 (Ended immediately)";
    }
    return formatted;
  };

  // Initialize Speech Recognition with continuous VAD
  useEffect(() => {
    intentionalAbortRef.current = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError("Web Speech API (SpeechRecognition) is not supported in this browser. Please try Chrome/Edge.");
      return;
    }

    // ── AEC HINT: acquire the mic with hardware echo-cancellation constraints ──
    // Chrome's SpeechRecognition picks up the *active* getUserMedia track, so
    // pre-acquiring it with echoCancellation:true causes the browser to apply
    // hardware/software AEC before audio reaches the recognition engine.
    // This suppresses most of the speaker-to-mic feedback at the source.
    let aecStream = null;
    navigator.mediaDevices?.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Explicitly set channel to mono — AEC works better on mono captures
        channelCount: 1
      }
    }).then(stream => {
      aecStream = stream; // hold reference so track stays alive
      console.log('[AEC] getUserMedia with echoCancellation:true acquired');
    }).catch(err => {
      console.warn('[AEC] getUserMedia AEC hint failed (non-blocking):', err.message);
    });

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    // continuous=true keeps the mic open permanently — the browser's built-in VAD
    // fires onresult whenever it detects a complete utterance.
    // NOTE: mic is intentionally stopped during TTS via muteMicDuringTTS().
    recognition.continuous = true;
    recognition.interimResults = true; // Enable interim for barge-in detection
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[STT] Recognition started');
      setIsListening(true);
      isListeningRef.current = true;
      setRecognitionError(null);
    };

    recognition.onresult = (event) => {
      // Only process final results
      const lastResultIndex = event.results.length - 1;
      const result = event.results[lastResultIndex];
      
      // If interim result detected while bot is speaking, that's a barge-in signal
      if (!result.isFinal) {
        if (isSpeakingRef.current && !isMutedRef.current) {
          console.log('[STT] Interim speech detected while bot speaking — barge-in: stopping bot');
          // Stop bot audio immediately; onBotFinishedSpeaking will unlock the turn
          if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          // Clear stale transcript buffer so we don't send bot echoes
          transcriptBufferRef.current = '';
          if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
          // Properly finalize the speaking state so turn-lock is released
          onBotFinishedSpeakingRef.current?.();
        }
        return; // Wait for final result
      }

      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence;
      console.log(`[STT] Final transcript: "${transcript}" (confidence: ${(confidence * 100).toFixed(1)}%)`);
      
      if (!transcript || isMutedRef.current) {
        console.log('[STT] Ignoring empty transcript or muted state');
        return;
      }

      // ── TRANSCRIPT-LEVEL ECHO FILTER ──────────────────────────────────────
      // Defence-in-depth: even if the mic mute didn't fire in time (race
      // condition, system audio delay), drop any transcript that closely
      // matches what the bot just said. Uses trigram overlap so partial
      // captures like "देता हूं" or "बता सकते हैं" are correctly rejected.
      const computeTrigramSimilarity = (a, b) => {
        const normalize = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
        const trigrams = s => {
          const t = new Set();
          for (let i = 0; i <= s.length - 3; i++) t.add(s.slice(i, i + 3));
          return t;
        };
        const ta = trigrams(normalize(a));
        const tb = trigrams(normalize(b));
        if (!ta.size || !tb.size) return 0;
        let shared = 0;
        for (const g of ta) if (tb.has(g)) shared++;
        return shared / Math.min(ta.size, tb.size);
      };

      const lastBot = lastBotSpokenTextRef.current || '';
      if (lastBot && transcript.length > 3) {
        const similarity = computeTrigramSimilarity(transcript, lastBot);
        if (similarity > 0.45) {
          console.warn(`[ECHO-FILTER] Dropped transcript — ${(similarity * 100).toFixed(0)}% trigram overlap with bot text: "${transcript}"`);
          return;
        }
      }

      // ── SPEAKING-STATE GUARD ───────────────────────────────────────────────
      // If bot is still marked as speaking (edge case: audio element fired onend
      // but isSpeakingRef hasn't cleared yet), treat this as a barge-in.
      if (isSpeakingRef.current) {
        console.log('[STT] Final transcript arrived while bot speaking — treating as barge-in');
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        transcriptBufferRef.current = '';
        if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
        onBotFinishedSpeakingRef.current?.();
      }

      // Block duplicate processing
      if (isProcessingTurnRef.current) {
        console.log('[STT] Dropped transcript — turn already processing:', transcript);
        return;
      }

      // Reset silence counter on successful speech
      silenceCountRef.current = 0;
      consecutiveSpeechErrorsRef.current = 0;

      // Aggregate transcript in buffer
      transcriptBufferRef.current = (transcriptBufferRef.current ? transcriptBufferRef.current + ' ' : '') + transcript;

      // Reset safety timeout on any speech
      lastSpeechTimeRef.current = Date.now();
      if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current);

      // Debounce turn submission: wait 0.6 seconds of silence since last final result
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
      turnTimerRef.current = setTimeout(() => {
        const finalText = transcriptBufferRef.current.trim();
        transcriptBufferRef.current = '';
        if (finalText) {
          console.log(`[STT-DEBOUNCE] Turn aggregated and finalized: "${finalText}"`);
          if (handleUserMessageRef.current) {
            handleUserMessageRef.current(finalText);
          }
        }
      }, 600);
    };

    recognition.onerror = (event) => {
      const err = event.error;
      console.error(`[STT] Error: ${err}`);
      
      if (err === 'aborted') {
        console.log('[STT] Recognition aborted (intentional).');
        return;
      }

      if (err === 'no-speech') {
        // Only trigger silence when bot is idle (not speaking, not thinking)
        if (isCallActiveRef.current && !isTerminalRef.current && !isOnHoldRef.current &&
            !isMutedRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
          silenceCountRef.current += 1;
          console.log(`[STT] Silence detected (count: ${silenceCountRef.current})`);
          if (handleUserMessageRef.current) {
            handleUserMessageRef.current('[silence]');
          }
        } else {
          console.log('[STT] No-speech ignored — bot is speaking/thinking or call inactive');
        }
        return;
      }

      if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
        console.error(`[STT] Mic permission error: ${err}`);
        setRecognitionError(`Microphone access error: ${err}. Please check browser permissions.`);
        hasMicErrorRef.current = true;
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }

      consecutiveSpeechErrorsRef.current += 1;
      console.warn(`[STT] Consecutive errors: ${consecutiveSpeechErrorsRef.current}`);
      if (consecutiveSpeechErrorsRef.current >= 5) {
        console.warn('[STT] Too many consecutive errors. Mic flagged as problematic.');
        setRecognitionError('Speech recognition is having trouble. Try refreshing or click mic to retry.');
        hasMicErrorRef.current = true;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      console.log('[STT] Recognition ended');
      
      if (intentionalAbortRef.current) {
        intentionalAbortRef.current = false;
        console.log('[STT] Intentional abort — not restarting');
        return;
      }

      if (hasMicErrorRef.current) {
        console.log('[STT] Mic error flag set — not restarting');
        return;
      }

      // ── KEY VAD FIX: Never auto-restart while bot is speaking. ──────────────
      // onBotFinishedSpeaking() is responsible for restarting after TTS ends.
      // Without this guard the mic comes back up mid-utterance and the bot
      // hears its own voice, creating the "echo customer turn" bug.
      if (isSpeakingRef.current) {
        console.log('[STT] Bot is speaking — deferring mic restart to onBotFinishedSpeaking');
        return;
      }
      
      // Auto-restart unless terminal/hold/muted/speaking
      if (isCallActiveRef.current && !isTerminalRef.current && !isOnHoldRef.current && !isMutedRef.current) {
        const delay = consecutiveSpeechErrorsRef.current > 0 ? 500 : 150;
        console.log(`[STT] Auto-restarting in ${delay}ms...`);
        setTimeout(() => {
          if (isCallActiveRef.current && !isTerminalRef.current && !intentionalAbortRef.current && !isSpeakingRef.current) {
            startListeningContinuous();
          }
        }, delay);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        intentionalAbortRef.current = true;
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
        turnTimerRef.current = null;
      }
      transcriptBufferRef.current = '';
      // Release AEC mic stream so browser stops showing mic-active indicator
      if (aecStream) {
        aecStream.getTracks().forEach(t => t.stop());
        aecStream = null;
      }
    };
  }, []);

  // Scroll transcript to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSpeaking, isListening, isThinking]);

  // Stable ref so the recognition closure (set up once in useEffect[]) can
  // always call the latest version of onBotFinishedSpeaking without stale closures.
  const onBotFinishedSpeakingRef = React.useRef(null);

  // ─── Core helper: finalize a terminal state after TTS completes ───────────
  const finalizePendingTerminal = () => {
    if (pendingTerminalStateRef.current) {
      const termState = pendingTerminalStateRef.current;
      pendingTerminalStateRef.current = null;
      console.log(`[FLOW] Finalizing terminal state: ${termState}`);
      setIsTerminal(true);
      isTerminalRef.current = true;
      // Stop recognition cleanly
      intentionalAbortRef.current = true;
      try { recognitionRef.current?.stop(); } catch (_) {}
      generateCallSummary(termState);
    }
  };

  // ─── After bot TTS finishes: unlock turn, restart listening ───────────────
  const onBotFinishedSpeaking = () => {
    console.log('[FLOW] Bot finished speaking');
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    isProcessingTurnRef.current = false; // Unlock for next user turn
    // Clear intentionalAbort so the upcoming startListeningContinuous() works
    intentionalAbortRef.current = false;

    if (pendingTerminalStateRef.current) {
      finalizePendingTerminal();
      return;
    }

    if (!isTerminalRef.current && !isOnHoldRef.current && !isMutedRef.current) {
      // ── VAD HOLDOFF: wait for speaker ring-down before reopening mic ────────
      // 600 ms gives the room acoustics / speaker echo time to decay so the
      // first customer utterance is not contaminated by bot's trailing audio.
      setTimeout(() => {
        if (!isTerminalRef.current && isCallActiveRef.current && !isSpeakingRef.current) {
          console.log('[FLOW] Holdoff complete — reopening mic for customer speech');
          startListeningContinuous();
        }
      }, 600);
    }
  };

  // Keep ref in sync so barge-in (inside recognition closure) can call it
  React.useEffect(() => {
    onBotFinishedSpeakingRef.current = onBotFinishedSpeaking;
  });

  // ── STT mute helper: stop recognition cleanly while bot speaks ─────────────
  // This is the primary fix for the VAD echo bug. The mic is fully silenced
  // for the entire duration of TTS. onBotFinishedSpeaking() restarts it after
  // a 600 ms holdoff so residual speaker ring-down has time to decay.
  const muteMicDuringTTS = () => {
    if (recognitionRef.current && isListeningRef.current) {
      console.log('[VAD] Muting mic for TTS — stopping STT session');
      // Use intentionalAbortRef so onend does NOT auto-restart
      intentionalAbortRef.current = true;
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    // Also flush any pending debounced turn — we don't want partial transcripts
    if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
    transcriptBufferRef.current = '';
  };

  // Audio Playback
  const playBotAudio = (url, text, forceMock = false) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = 'hi-IN';
    }

    // ── MUTE MIC IMMEDIATELY — before any TTS starts ──────────────────────────
    muteMicDuringTTS();

    lastBotSpokenTextRef.current = text || '';
    console.log(`[TTS] Playing audio. URL=${url || 'mock'} Text="${(text || '').slice(0, 60)}..."`);

    const useMock = forceMock || isMockMode;
    if (useMock) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;
        window._activeUtterance = utterance; // Avoid Chrome GC bug
        utterance.lang = 'hi-IN';
        utterance.rate = 1.0;

        let synthTimeout = null;
        let finished = false;

        const finishOnce = () => {
          if (finished) return;
          finished = true;
          if (synthTimeout) clearTimeout(synthTimeout);
          onBotFinishedSpeakingRef.current?.();
        };

        utterance.onstart = () => {
          console.log('[TTS] SpeechSynthesis started');
          setIsSpeaking(true);
          isSpeakingRef.current = true;
          setIsThinking(false);
          isThinkingRef.current = false;
          // Mic was already muted in muteMicDuringTTS() before speak() was called.
          // This is belt-and-suspenders — mute again in case of race conditions.
          muteMicDuringTTS();

          // Chrome stall workaround: if synthesis hasn't started speaking after 1.5s, recover
          synthTimeout = setTimeout(() => {
            if (isSpeakingRef.current && !finished && window.speechSynthesis.speaking === false) {
              console.warn('[TTS] Chrome synthesis stall detected — recovering');
              window.speechSynthesis.cancel();
              finishOnce();
            }
          }, 1500);
        };

        utterance.onend = () => {
          console.log('[TTS] SpeechSynthesis ended');
          finishOnce();
        };

        utterance.onerror = (e) => {
          // 'interrupted' is normal on barge-in — not an error
          if (e.error === 'interrupted' || e.error === 'canceled') {
            console.log('[TTS] SpeechSynthesis interrupted (barge-in or cancel) — recovering');
          } else {
            console.error('[TTS] SpeechSynthesis error:', e.error);
          }
          finishOnce();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        // No speechSynthesis available — fallback with timer
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setIsThinking(false);
        isThinkingRef.current = false;
        const wordCount = (text || '').split(' ').length;
        const estimatedMs = Math.max(2000, wordCount * 300);
        setTimeout(() => {
          onBotFinishedSpeaking();
        }, estimatedMs);
      }
    } else {
      if (audioRef.current && url) {
        try {
          audioRef.current.pause();
          audioRef.current.src = url;
          audioRef.current.load();
          audioRef.current.play()
            .then(() => {
              console.log('[TTS] Audio element playing');
              setIsThinking(false);
              isThinkingRef.current = false;
            })
            .catch((err) => {
              console.error('[TTS] Audio autoplay blocked:', err);
              setIsThinking(false);
              isThinkingRef.current = false;
              onBotFinishedSpeaking();
            });
        } catch (e) {
          console.error('[TTS] Audio play exception:', e);
          setIsThinking(false);
          isThinkingRef.current = false;
          onBotFinishedSpeaking();
        }
      } else {
        // No URL available — skip audio, continue flow
        console.warn('[TTS] No audio URL provided. Skipping playback.');
        setIsThinking(false);
        isThinkingRef.current = false;
        onBotFinishedSpeaking();
      }
    }
  };

  const handleAudioPlayStart = () => {
    console.log('[TTS] Audio element: playback started');
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    setIsThinking(false);
    isThinkingRef.current = false;
    // Belt-and-suspenders: ensure mic is off even if it restarted between
    // playBotAudio() call and the actual <audio> element firing onplay.
    muteMicDuringTTS();
  };

  const handleAudioPlayEnded = () => {
    console.log('[TTS] Audio element: playback ended');
    onBotFinishedSpeaking();
  };

  const handleAudioPlayError = (e) => {
    console.error('[TTS] Audio element error:', e);
    setIsThinking(false);
    isThinkingRef.current = false;
    onBotFinishedSpeaking(); // Always recover — restart listening
  };

  // startListeningContinuous — starts recognition session (continuous=true handles VAD internally)
  const startListeningContinuous = () => {
    if (!recognitionRef.current) return;
    if (isTerminalRef.current || isOnHoldRef.current || isMutedRef.current || hasMicErrorRef.current) return;
    if (isListeningRef.current) {
      console.log('[STT] Already listening — skipping start');
      return;
    }
    try {
      intentionalAbortRef.current = false;
      recognitionRef.current.lang = 'hi-IN';
      recognitionRef.current.start();
      console.log('[STT] Started continuous listening');
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes('already started') || msg.includes('InvalidStateError')) {
        console.log('[STT] Recognition already running — OK');
      } else {
        console.warn('[STT] Could not start recognition:', msg);
        // Retry after short delay
        setTimeout(() => {
          if (isCallActiveRef.current && !isTerminalRef.current && !isListeningRef.current) {
            try { recognitionRef.current?.start(); } catch (_) {}
          }
        }, 500);
      }
    }
  };

  // Legacy alias for code that calls startListening()
  const startListening = startListeningContinuous;

  const toggleListening = () => {
    if (isListeningRef.current) {
      intentionalAbortRef.current = true;
      try { recognitionRef.current?.stop(); } catch (_) {}
      setIsListening(false);
      isListeningRef.current = false;
    } else {
      hasMicErrorRef.current = false;
      consecutiveSpeechErrorsRef.current = 0;
      startListeningContinuous();
    }
  };

  // Trigger outbound call
  const handleInitiateCall = async (e) => {
    e.preventDefault();
    
    // Trim and format inputs
    const trimmedName = customerName.trim();
    setCustomerName(trimmedName);
    
    const trimmedBank = bankName.trim();
    setBankName(trimmedBank);

    const formattedPhone = phone ? String(phone).replace(/\s+/g, '') : "";
    setPhone(formattedPhone);

    // Validate all fields
    const nameErr = validateName(trimmedName);
    const amtErr = validateAmount(amount);
    const bankErr = validateBank(trimmedBank);
    const phoneErr = validatePhone(formattedPhone);
    const dateVal = validateDate(dueDate);

    // Update error states
    setNameError(nameErr);
    setAmountError(amtErr);
    setBankError(bankErr);
    setPhoneError(phoneErr);
    setDateError(dateVal.error);
    setDateWarning(dateVal.warning);

    // If any error exists, block triggering the call
    if (nameErr || amtErr || bankErr || phoneErr || dateVal.error) {
      return;
    }

    if (!trimmedName || !amount || !trimmedBank || !formattedPhone || !dueDate) return;

    setMessages([]);
    setRecognitionError(null);
    setIsTerminal(false);
    setCallDuration(0);
    setCallSummary(null);
    setPaymentLink('');
    setPaymentLinkSent(false);
    setCopied(false);
    setIsProcessing(true);
    hasMicErrorRef.current = false;
    consecutiveSpeechErrorsRef.current = 0;
    unclearRetriesRef.current = 0;
    amountDisclosedRef.current = false;
    alreadyPaidRef.current = false;
    isProcessingTurnRef.current = false;
    silenceCountRef.current = 0;
    apiRetryCountRef.current = 0;
    pendingTerminalStateRef.current = null;
    intentionalAbortRef.current = false;
    lastSpeechTimeRef.current = Date.now(); // Reset speech timer on new call
    if (recognitionRef.current) {
      recognitionRef.current.lang = 'hi-IN'; // Ensure call starts with Hindi
    }

    if (isMockMode) {
      setTimeout(() => {
        const botText = `Hello, kya meri baat ${trimmedName} se ho rahi hai?`;
        setSessionId('mock_session_456');
        setCurrentState('GREETING');
        setMessages([
          {
            id: 'bot_0',
            sender: 'bot',
            text: botText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            confidence: 99,
            emotion: 'Professional',
            intent: 'GREETING',
            language: 'Hindi'
          }
        ]);
        setIsCallActive(true);
        setIsThinking(true);
        setIsProcessing(false);
        playBotAudio(null, botText, true);
      }, 1000);
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch('/api/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            amount: parseInt(amount),
            bank_name: trimmedBank,
            engine: voiceEngine,
            voice: voiceGender
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Connection failed");
        const data = await res.json();

        setSessionId(data.session_id);
        setCurrentState('GREETING');
        setMessages([
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: data.bot_text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            confidence: 99,
            emotion: 'Professional',
            intent: 'GREETING',
            language: 'Hindi'
          }
        ]);
        setIsCallActive(true);
        setIsThinking(true);
        setIsProcessing(false);
        playBotAudio(data.audio_url, data.bot_text);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("Start call API failure:", err);
        setIsProcessing(false);
        if (err.name === 'AbortError') {
          setRecognitionError("Connection timed out. Please check the backend server status and try again.");
        } else {
          setRecognitionError("Backend connection failed. Please ensure the server is running.");
        }
      }
    }
  };

  // ─── Graceful call end: stop current audio → play closing line via locked voice ─
  // Used by both the silence retry-limit and the hard 15-second safety timeout.
  // FIX (Issue 1 – Overlap): Stops the current audio BEFORE playing the closing line.
  // FIX (Issue 2 – Wrong voice): Fetches audio from /api/tts (locked rohan/bulbul:v3)
  //   instead of using window.speechSynthesis (browser built-in voice).
  const endCallGracefully = async (reason) => {
    if (isTerminalRef.current || !isCallActiveRef.current) return; // Already ended
    console.log(`[FLOW] endCallGracefully called. Reason: ${reason}`);

    // ── STEP 1: Stop any currently playing audio immediately (prevents overlap) ──
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    isSpeakingRef.current = false;

    const closingText = 'Theek hai, main baad mein call karta hoon. Dhanyavaad.';
    pendingTerminalStateRef.current = 'CALL_ENDED_UNCLEAR';
    setCurrentState('CALL_ENDED_UNCLEAR');
    currentStateRef.current = 'CALL_ENDED_UNCLEAR';

    // Clear the hard safety timer
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = null;
    }

    setMessages(prev => [...prev, {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: closingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      confidence: 99,
      emotion: 'Neutral',
      intent: 'CALL_ENDED_UNCLEAR',
      language: 'Hindi'
    }]);

    setIsThinking(false);
    isThinkingRef.current = false;
    isProcessingTurnRef.current = false;

    // ── STEP 2: Synthesize via backend /api/tts to use locked rohan/bulbul:v3 voice ──
    // This is CRITICAL — playBotAudio(null, text, forceMock=true) would use
    // window.speechSynthesis (wrong voice). We always go through the backend.
    if (!isMockModeRef.current) {
      try {
        console.log('[VOICE] endCallGracefully: fetching closing TTS from /api/tts...');
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: closingText,
            session_id: sessionIdRef.current,
            engine: voiceEngine,
            voice: voiceGender
          }),
          signal: controller.signal
        });
        clearTimeout(tid);
        if (res.ok) {
          const ttsData = await res.json();
          console.log(`[VOICE] endCallGracefully: received audio_url=${ttsData.audio_url} — playing with locked voice`);
          playBotAudio(ttsData.audio_url, closingText, false); // false = use real audio element (locked voice)
          return;
        }
        console.warn('[VOICE] endCallGracefully: /api/tts returned non-OK, falling back to browser TTS');
      } catch (e) {
        console.warn('[VOICE] endCallGracefully: /api/tts fetch failed, falling back to browser TTS:', e.message);
      }
    }

    // ── STEP 3: Fallback — browser TTS (mock mode or backend unavailable) ──
    console.log('[VOICE] endCallGracefully: using browser speechSynthesis as last resort');
    playBotAudio(null, closingText, true);
  };


  // Hard safety timeout: if no user speech for NO_SPEECH_TIMEOUT_MS, end the call
  useEffect(() => {
    if (!isCallActive || isTerminal) {
      // Clear any pending timer when call ends or isn't active
      if (noSpeechTimerRef.current) {
        clearTimeout(noSpeechTimerRef.current);
        noSpeechTimerRef.current = null;
      }
      return;
    }

    const scheduleCheck = () => {
      if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = setTimeout(() => {
        const msSinceSpeech = Date.now() - lastSpeechTimeRef.current;
        console.log(`[SAFETY TIMEOUT] No speech for ${msSinceSpeech}ms (limit: ${NO_SPEECH_TIMEOUT_MS}ms)`);
        if (msSinceSpeech >= NO_SPEECH_TIMEOUT_MS && !isTerminalRef.current && isCallActiveRef.current) {
          console.warn('[SAFETY TIMEOUT] Hard timeout reached — ending call gracefully');
          endCallGracefully('hard_15s_timeout');
        }
      }, NO_SPEECH_TIMEOUT_MS);
    };

    scheduleCheck();
    return () => {
      if (noSpeechTimerRef.current) {
        clearTimeout(noSpeechTimerRef.current);
        noSpeechTimerRef.current = null;
      }
    };
  }, [isCallActive, isTerminal]);

  // Process user speech — the core conversation turn handler
  const handleUserMessage = async (userText) => {
    if (!userText || !userText.trim()) return;

    // Guard: don't process if call inactive or already terminal
    if (!isCallActiveRef.current || isTerminalRef.current) {
      console.log('[FLOW] handleUserMessage ignored — call inactive or terminal');
      return;
    }

    // Guard: prevent overlapping turns
    if (isProcessingTurnRef.current) {
      console.log('[FLOW] handleUserMessage dropped — turn in progress. Text:', userText);
      return;
    }

    isProcessingTurnRef.current = true;

    const isSilence = userText === '[silence]';

    // ── STT LOGGING (Requirement 1) ──────────────────────────────────────────
    if (isSilence) {
      console.log(`[STT-LOG] Turn received: SILENCE (no speech detected). unclearRetries=${unclearRetriesRef.current}/${MAX_SILENCE_RETRIES}`);
    } else {
      console.log(`[STT-LOG] Turn received: transcript="${userText}" (length=${userText.length})`);
      // Reset speech timer and safety timeout on any real speech
      lastSpeechTimeRef.current = Date.now();
      if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = setTimeout(() => {
        const ms = Date.now() - lastSpeechTimeRef.current;
        if (ms >= NO_SPEECH_TIMEOUT_MS && !isTerminalRef.current && isCallActiveRef.current) {
          console.warn('[SAFETY TIMEOUT] Hard timeout reached — ending call gracefully');
          endCallGracefully('hard_15s_timeout');
        }
      }, NO_SPEECH_TIMEOUT_MS);
    }

    // ── SILENCE / RETRY LIMIT (Requirement 2) ───────────────────────────────
    // This runs in BOTH mock and real API mode to guarantee the call ends.
    if (isSilence) {
      unclearRetriesRef.current += 1;
      console.log(`[SILENCE] Retry ${unclearRetriesRef.current}/${MAX_SILENCE_RETRIES}. State: ${currentStateRef.current}`);
      if (unclearRetriesRef.current > MAX_SILENCE_RETRIES) {
        console.warn('[SILENCE] Max retries exceeded — ending call gracefully (frontend guard)');
        isProcessingTurnRef.current = false;
        endCallGracefully('max_silence_retries');
        return; // Do NOT send [silence] to the backend — end locally
      }
    }

    console.log(`[FLOW] Processing user turn: "${userText}"`);

    const userConf = isSilence ? 0 : Math.floor(Math.random() * (99 - 90) + 90);
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const detectedIntent = textContainsIntent(userText);
    if (!isSilence) {
      console.log(`[STT-LOG] Intent detected: ${detectedIntent} | State: ${currentStateRef.current}`);
      // Reset silence counter — only consecutive silences should count toward the limit
      unclearRetriesRef.current = 0;
    }

    if (!isSilence) {
      setMessages(prev => [...prev, {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: userText,
        timestamp: userTimestamp,
        confidence: userConf,
        emotion: 'Neutral',
        intent: detectedIntent,
        language: 'Hinglish / Hindi'
      }]);
    }

    setIsThinking(true);
    isThinkingRef.current = true;

    const currentMockMode = isMockModeRef.current;

    if (currentMockMode) {
      setTimeout(() => {
        const mockResult = simulateMockReply(userText, currentStateRef.current, customerName, amount, bankName, unclearRetriesRef, amountDisclosedRef, alreadyPaidRef);
        console.log(`[LLM-MOCK] State: ${mockResult.state}, Intent: ${mockResult.intent}, Terminal: ${mockResult.is_terminal}`);
        console.log(`[LLM-MOCK] Bot: "${mockResult.bot_text}"`);

        if (mockResult.no_op || mockResult.bot_text === '[continue_listening]') {
          console.log('[LLM-MOCK] No-op received. Continuing to listen without advancing state.');
          setIsThinking(false);
          isThinkingRef.current = false;
          isProcessingTurnRef.current = false; // Unlock for next user turn
          if (!isTerminalRef.current && !isOnHoldRef.current && !isMutedRef.current) {
            startListeningContinuous();
          }
          return;
        }

        setCurrentState(mockResult.state);
        currentStateRef.current = mockResult.state;

        if (mockResult.state === 'PAYMENT_CONFIRM') {
          const generatedLink = `https://pay.bankconnect.mock/pay/mock_${Date.now().toString().slice(-4)}?amt=${amount}&cust=${encodeURIComponent(customerName)}&bk=${encodeURIComponent(bankName)}`;
          setPaymentLink(generatedLink);
          setPaymentLinkSent(true);
        }

        if (mockResult.is_terminal) {
          pendingTerminalStateRef.current = mockResult.state;
        } else {
          pendingTerminalStateRef.current = null;
        }

        setUserMetadata({
          intent: mockResult.intent,
          emotion: mockResult.emotion,
          confidence: userConf
        });

        const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setMessages(prev => [...prev, {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: mockResult.bot_text,
          timestamp: botTimestamp,
          confidence: 98,
          emotion: 'Empathetic',
          intent: mockResult.state,
          language: 'Hindi'
        }]);

        setIsThinking(false);
        isThinkingRef.current = false;
        // isProcessingTurnRef will be unlocked in onBotFinishedSpeaking
        playBotAudio(null, mockResult.bot_text, true);
      }, 800); // Slightly faster thinking time for better UX
    } else {
      // Real API mode with retry logic
      const attemptReply = async (attempt) => {
        try {
          console.log(`[LLM] Calling /api/reply (attempt ${attempt}/${MAX_API_RETRIES + 1})`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const res = await fetch('/api/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionIdRef.current,
              user_text: userText
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${errBody}`);
          }

          const data = await res.json();
          console.log(`[LLM] Response: state=${data.state}, terminal=${data.is_terminal}`);
          console.log(`[LLM] Bot text: "${data.bot_text}"`);

          // Check for no-op continue_listening signal
          if (data.no_op || data.bot_text === '[continue_listening]') {
            console.log('[LLM] No-op received. Continuing to listen without advancing state or playing audio.');
            apiRetryCountRef.current = 0; // Reset on success
            setIsThinking(false);
            isThinkingRef.current = false;
            isProcessingTurnRef.current = false; // Unlock for next user turn
            
            // Resume listening
            if (!isTerminalRef.current && !isOnHoldRef.current && !isMutedRef.current) {
              startListeningContinuous();
            }
            return;
          }

          // Validate response
          if (!data.bot_text || data.bot_text === 'NaN' || data.bot_text.trim() === '') {
            throw new Error('Empty or invalid bot_text in response');
          }

          apiRetryCountRef.current = 0; // Reset on success
          const userIntentMatch = textContainsIntent(userText);
          const derivedEmotion = data.is_terminal ? 'Defensive' : 'Cooperative';

          setCurrentState(data.state);
          currentStateRef.current = data.state;

          if (data.payment_link) {
            setPaymentLink(data.payment_link);
            setPaymentLinkSent(true);
          } else if (data.state === 'PAYMENT_CONFIRM') {
            const generatedLink = `https://pay.bankconnect.mock/pay/${sessionIdRef.current || 'active'}?amt=${amount}&cust=${encodeURIComponent(customerName)}&bk=${encodeURIComponent(bankName)}`;
            setPaymentLink(generatedLink);
            setPaymentLinkSent(true);
          }

          if (data.is_terminal) {
            pendingTerminalStateRef.current = data.state;
          } else {
            pendingTerminalStateRef.current = null;
          }

          setUserMetadata({
            intent: userIntentMatch,
            emotion: derivedEmotion,
            confidence: userConf
          });

          const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setMessages(prev => [...prev, {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: data.bot_text,
            timestamp: botTimestamp,
            confidence: 98,
            emotion: 'Empathetic',
            intent: data.state,
            language: 'Hindi'
          }]);

          setIsThinking(false);
          isThinkingRef.current = false;
          playBotAudio(data.audio_url, data.bot_text);

        } catch (err) {
          const isTimeout = err?.name === 'AbortError';
          console.error(`[LLM] Error (attempt ${attempt}):`, err.message || err);

          if (attempt <= MAX_API_RETRIES && !isTerminalRef.current) {
            const retryDelay = 1000 * attempt;
            console.log(`[LLM] Retrying in ${retryDelay}ms...`);
            setRecognitionError(`Connection issue. Retrying... (${attempt}/${MAX_API_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attemptReply(attempt + 1);
          }

          // All retries exhausted
          console.error('[LLM] All retries exhausted. Ending call.');
          setIsThinking(false);
          isThinkingRef.current = false;
          isProcessingTurnRef.current = false;
          setRecognitionError('Connection lost after retries. Call terminated.');
          setIsTerminal(true);
          isTerminalRef.current = true;
          setCurrentState('CALL_FAILED');
          intentionalAbortRef.current = true;
          try { recognitionRef.current?.stop(); } catch (_) {}
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          generateCallSummary('CALL_FAILED');
        }
      };

      await attemptReply(1);
    }
  };

  // Keep handleUserMessageRef in sync with the latest closure
  // This is used by the recognition callbacks to avoid stale closures
  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  });

  // Detect basic intent label
  const textContainsIntent = (txt) => {
    return detectIntent(txt, customerName);
  };

  // Compile Outcome metrics for the End-Call summary screen
  const generateCallSummary = (finalState) => {
    let outcome = 'Customer Unreachable';
    let promiseToPay = 'No';
    let sentiment = 'Neutral';
    let summaryText = '';

    // Calculate user message count to detect empty conversations (LOG-008)
    const userMsgCount = messages.filter(m => m.sender === 'user').length;
    const isEmptyCall = userMsgCount === 0;

    if (finalState === 'PAYMENT_CONFIRM') {
      outcome = 'Payment Link Dispatched';
      promiseToPay = 'Yes';
      sentiment = 'Positive / Cooperative';
      summaryText = `${customerName} agreed to pay the outstanding due amount balance of ₹${parseFloat(amount).toLocaleString()} for ${bankName} immediately. A secure payment link has been dispatched to their registered mobile number.`;
    } else if (finalState === 'CALL_ENDED_SUCCESS') {
      outcome = 'Promise to Pay (PTP) Secured';
      promiseToPay = 'Yes';
      sentiment = 'Positive / Cooperative';
      summaryText = `${customerName} promised to pay the outstanding due amount balance of ₹${parseFloat(amount).toLocaleString()} for ${bankName}. This payment commitment has been recorded in the collection ledger.`;
    } else if (finalState === 'CALL_ENDED_REFUSED') {
      outcome = 'Payment Refused';
      promiseToPay = 'No';
      sentiment = 'Defensive';
      summaryText = `${customerName} acknowledged the outstanding due amount of ₹${parseFloat(amount).toLocaleString()} for ${bankName} but refused to make a payment commitment during this interaction. Requires immediate escalation.`;
    } else if (finalState === 'CALL_ENDED_WRONG_NUMBER') {
      outcome = 'Wrong Contact Information';
      promiseToPay = 'No';
      sentiment = 'Neutral';
      summaryText = `The recipient indicated that the contact details for the ${bankName} account with due amount amount ₹${parseFloat(amount).toLocaleString()} are incorrect, and they are not ${customerName}.`;
    } else if (finalState === 'CALL_ENDED_UNCLEAR') {
      outcome = 'Customer Unreachable';
      promiseToPay = 'Pending';
      sentiment = 'Neutral';
      summaryText = `The call with ${customerName} regarding the outstanding due amount of ₹${parseFloat(amount).toLocaleString()} for ${bankName} was terminated as the customer's responses were unclear or they asked to be contacted later.`;
    } else if (finalState === 'CALL_ENDED_FINANCIAL') {
      outcome = 'Financial Hardship Recorded';
      promiseToPay = 'No';
      sentiment = 'Neutral';
      summaryText = `${customerName} indicated experiencing severe financial or health hardships (e.g. loss of employment/medical emergency). Collection activities have been suspended, and the hardship status is recorded in the ledger.`;
    } else if (finalState === 'CALL_ENDED_CALLBACK') {
      outcome = 'Callback Scheduled';
      promiseToPay = 'No';
      sentiment = 'Neutral';
      summaryText = `${customerName} indicated they are busy (e.g. in a meeting, driving) and requested a callback. The callback schedule has been registered in the system ledger.`;
    } else if (finalState === 'CALL_ENDED_ESCALATED') {
      outcome = 'Escalated to Human Agent';
      promiseToPay = 'No';
      sentiment = 'Cooperative';
      summaryText = `${customerName} requested to speak with a human agent or manager regarding the outstanding due amount of ₹${parseFloat(amount).toLocaleString()} for ${bankName}. The call has been transferred to a live customer representative.`;
    } else if (finalState === 'CALL_FAILED') {
      outcome = 'Call Failed / Connection Lost';
      promiseToPay = 'Unknown';
      sentiment = 'N/A';
      summaryText = `The call attempt regarding the ${bankName} due amount of ₹${parseFloat(amount).toLocaleString()} for ${customerName} failed due to a network connection loss.`;
    } else {
      outcome = 'Customer Unreachable';
      promiseToPay = 'Unknown';
      sentiment = 'Neutral';
      summaryText = `The call with ${customerName} regarding the outstanding due amount of ₹${parseFloat(amount).toLocaleString()} for ${bankName} ended abruptly.`;
    }

    // Override summary text if the conversation is empty (LOG-008)
    if (isEmptyCall) {
      summaryText = `The call attempt to ${customerName} regarding the outstanding due amount of ₹${parseFloat(amount).toLocaleString()} for ${bankName} was initiated but ended immediately without customer engagement.`;
    }

    setCallSummary({
      duration: formatSummaryDuration(callDuration, finalState),
      outcome,
      promiseToPay,
      paymentDate: finalState === 'PAYMENT_CONFIRM' ? 'Immediate (Same Day)' : (promiseToPay === 'Yes' ? 'Scheduled (Later Date)' : 'N/A'),
      sentiment,
      summaryText
    });
  };

  // Replay voice URL
  const handleReplay = (e, msg) => {
    e.stopPropagation();
    playBotAudio(msg.audio_url, msg.text);
  };

  // End Call Button
  const handleEndCall = () => {
    isTerminalRef.current = true;
    isProcessingTurnRef.current = false;
    setIsTerminal(true);
    generateCallSummary(currentState);
    intentionalAbortRef.current = true;
    try { recognitionRef.current?.stop(); } catch (_) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setIsListening(false);
    isListeningRef.current = false;
    setIsThinking(false);
    isThinkingRef.current = false;
    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    transcriptBufferRef.current = '';
  };

  // Mute / Speaker toggles
  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      if (!isSpeakingRef.current && !isThinkingRef.current && !isTerminalRef.current) {
        startListeningContinuous();
      }
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      intentionalAbortRef.current = true;
      try { recognitionRef.current?.stop(); } catch (_) {}
    }
  };

  const handleHoldToggle = () => {
    if (isOnHoldRef.current) {
      setIsOnHold(false);
      if (!isSpeakingRef.current && !isThinkingRef.current && !isTerminalRef.current) {
        startListening();
      }
    } else {
      setIsOnHold(true);
      if (recognitionRef.current) {
        intentionalAbortRef.current = true;
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  };

  const loadJsPDF = () => {
    return new Promise((resolve, reject) => {
      if (window.jspdf) {
        resolve(window.jspdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        resolve(window.jspdf);
      };
      script.onerror = () => {
        reject(new Error('Failed to load jsPDF library'));
      };
      document.body.appendChild(script);
    });
  };

  const exportCallSummary = async (format) => {
    if (!callSummary) return;

    if (format === 'json') {
      const dataObj = {
        customerName,
        phone,
        dueId,
        dueDate,
        amount,
        bankName,
        summary: callSummary,
        transcript: messages.map(m => ({
          sender: m.sender,
          timestamp: m.timestamp,
          text: m.text,
          intent: m.intent,
          emotion: m.emotion
        }))
      };
      const jsonBlob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call_summary_${sessionId || 'session'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'txt') {
      let txtContent = `CALL SUMMARY REPORT\n`;
      txtContent += `===================\n\n`;
      txtContent += `Customer Name: ${customerName}\n`;
      txtContent += `Phone Number: ${phone}\n`;
      txtContent += `Due ID: ${dueId}\n`;
      txtContent += `Due Date: ${dueDate}\n`;
      txtContent += `Outstanding Balance: INR ${parseFloat(amount).toLocaleString()}\n`;
      txtContent += `Bank Name: ${bankName}\n\n`;
      txtContent += `CALL SUMMARY LOG\n`;
      txtContent += `----------------\n`;
      txtContent += `Duration: ${callSummary.duration}\n`;
      txtContent += `PTP Status: ${callSummary.promiseToPay}\n`;
      txtContent += `Disposition: ${callSummary.outcome}\n`;
      txtContent += `Sentiment: ${callSummary.sentiment}\n\n`;
      txtContent += `Summary Log:\n${callSummary.summaryText}\n\n`;
      txtContent += `CALL TRANSCRIPT\n`;
      txtContent += `---------------\n`;
      messages.forEach(m => {
        const sender = m.sender === 'user' ? 'Customer' : 'BankConnect Assistant';
        txtContent += `[${m.timestamp}] ${sender}: ${m.text}\n`;
      });
      
      const txtBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(txtBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call_summary_${sessionId || 'session'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      try {
        const jspdfLib = await loadJsPDF();
        const { jsPDF } = jspdfLib;
        const doc = new jsPDF();
        
        // Page setup
        doc.setFont("helvetica", "normal");
        doc.setFontSize(20);
        doc.setTextColor(14, 19, 38); // #0E1326
        doc.text("Call Summary Report", 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 26);
        
        // Line separator
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.line(20, 30, 190, 30);
        
        // Customer Details Section
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229); // Indigo-600
        doc.text("Customer & Due Amount Details", 20, 40);
        
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85); // Slate-700
        doc.text(`Customer Name: ${customerName}`, 20, 48);
        doc.text(`Phone Number: ${phone}`, 20, 54);
        doc.text(`Due ID: ${dueId}`, 20, 60);
        doc.text(`Due Date: ${dueDate}`, 110, 48);
        doc.text(`Outstanding Balance: INR ${parseFloat(amount).toLocaleString()}`, 110, 54);
        doc.text(`Bank Name: ${bankName}`, 110, 60);
        
        doc.line(20, 66, 190, 66);
        
        // Outcomes
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text("Call Disposition & Outcomes", 20, 76);
        
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text(`Duration: ${callSummary.duration}`, 20, 84);
        doc.text(`PTP Status: ${callSummary.promiseToPay}`, 20, 90);
        doc.text(`Disposition: ${callSummary.outcome}`, 110, 84);
        doc.text(`Sentiment: ${callSummary.sentiment}`, 110, 90);
        
        // Wrapped Summary Text
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42); // Slate-900
        doc.text("Summary Log:", 20, 100);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // Slate-600
        
        // Wrap summary text
        const summaryLines = doc.splitTextToSize(callSummary.summaryText, 170);
        let y = 106;
        summaryLines.forEach(line => {
          doc.text(line, 20, y);
          y += 5;
        });
        
        y += 5;
        doc.setDrawColor(226, 232, 240);
        doc.line(20, y, 190, y);
        y += 10;
        
        // Transcript Section
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text("Call Transcript", 20, y);
        y += 8;
        
        doc.setFontSize(9);
        messages.forEach(m => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const sender = m.sender === 'user' ? 'Customer' : 'BankConnect Assistant';
          const timeStr = `[${m.timestamp}] ${sender}:`;
          
          doc.setFont("helvetica", "bold");
          doc.setTextColor(51, 65, 85);
          doc.text(timeStr, 20, y);
          
          const nameWidth = doc.getTextWidth(timeStr) + 2;
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          
          const textLines = doc.splitTextToSize(m.text, 170 - nameWidth);
          textLines.forEach((line, index) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            doc.text(line, 20 + nameWidth, y);
            if (index < textLines.length - 1) {
              y += 4.5;
            }
          });
          y += 6;
        });
        
        doc.save(`call_summary_${sessionId || 'session'}.pdf`);
      } catch (err) {
        console.error("PDF generation error:", err);
        alert("Failed to export as PDF. Please try again.");
      }
    }
  };

  // Reset conversation states
  const handleRestart = () => {
    // Stop recognition cleanly
    intentionalAbortRef.current = true;
    try { recognitionRef.current?.stop(); } catch (_) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    // Reset all refs
    isProcessingTurnRef.current = false;
    silenceCountRef.current = 0;
    apiRetryCountRef.current = 0;
    pendingTerminalStateRef.current = null;
    hasMicErrorRef.current = false;
    consecutiveSpeechErrorsRef.current = 0;
    unclearRetriesRef.current = 0;
    isSpeakingRef.current = false;
    isThinkingRef.current = false;
    isListeningRef.current = false;
    isTerminalRef.current = false;
    isCallActiveRef.current = false;
    // Reset state
    setIsCallActive(false);
    setSessionId(null);
    setMessages([]);
    setCurrentState('GREETING');
    setIsTerminal(false);
    setIsSpeaking(false);
    setIsListening(false);
    setIsThinking(false);
    setCallDuration(0);
    setCallSummary(null);
    setPaymentLink('');
    setPaymentLinkSent(false);
    setCopied(false);
    setNameError(null);
    setAmountError(null);
    setBankError(null);
    setPhoneError(null);
    setDateError(null);
    setDateWarning(null);
    setIsProcessing(false);
    setShowExportDropdown(false);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-hidden select-none relative transition-colors duration-300 ${
      isDarkMode ? 'bg-[#070B1A] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      
      {/* Background Mesh Glow */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-colors duration-300 ${
        isDarkMode ? 'bg-[#4F46E5]/10' : 'bg-[#4F46E5]/5'
      }`}></div>
      <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-colors duration-300 ${
        isDarkMode ? 'bg-[#7C3AED]/10' : 'bg-[#7C3AED]/5'
      }`}></div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onPlay={handleAudioPlayStart}
        onEnded={handleAudioPlayEnded}
        onError={handleAudioPlayError}
        className="hidden"
      />

      {/* 1. Header Bar */}
      <header className={`h-16 px-6 flex items-center justify-between shrink-0 z-30 border-b transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0E1326] border-slate-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-[15px] font-bold tracking-wide uppercase transition-colors ${
              isDarkMode ? 'text-white' : 'text-[#0F172A]'
            }`}>
              BankConnect Assistant
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`text-[9px] font-semibold tracking-wider uppercase transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {isCallActive ? 'Call in Progress' : 'System Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          {/* Active Call Badge / Timer */}
          {isCallActive && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 rounded-xl">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-red-400 tracking-wider">
                {formatTimer(callDuration)}
              </span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl transition duration-150 cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Main UI Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!isCallActive ? (
            /* Setup Outbound Call Form */
            <motion.div
              key="setup-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10"
            >
              <div className={`w-full max-w-[440px] border rounded-[24px] py-5 px-6 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-205 shadow-2xl shadow-slate-100'
              }`}>
                {/* Background lighting */}
                <div className="absolute top-[-50px] right-[-50px] w-[180px] h-[180px] bg-[#4F46E5]/10 rounded-full blur-[40px]"></div>

                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 border transition-colors ${
                    isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-650'
                  }`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <h2 className={`text-xl font-bold tracking-wide transition-colors ${
                    isDarkMode ? 'text-white' : 'text-[#0F172A]'
                  }`}>Outbound AI Dialer</h2>
                  <p className={`text-[11px] mt-1 leading-relaxed ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Trigger an automated Hindi/Hinglish collection call with customized parameters.
                  </p>
                </div>

                <form onSubmit={handleInitiateCall} className="space-y-3">
                  <div>
                    <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ml-1 transition-colors ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setNameError(null);
                      }}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all font-semibold ${
                        isDarkMode 
                          ? 'bg-[#070B1A] text-slate-200 border-slate-800 focus:border-indigo-500' 
                          : 'bg-slate-50 text-slate-800 border-slate-250 focus:border-indigo-500'
                      } ${nameError ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="e.g. Mahima Dangi"
                    />
                    {nameError && (
                      <p className="text-red-400 text-[11px] mt-1 ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {nameError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ml-1 transition-colors ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Due Amount (INR)
                      </label>
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setAmountError(null);
                        }}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all font-semibold ${
                          isDarkMode 
                            ? 'bg-[#070B1A] text-slate-200 border-slate-800 focus:border-indigo-500' 
                            : 'bg-slate-50 text-slate-800 border-slate-250 focus:border-indigo-500'
                        } ${amountError ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="e.g. 5000"
                      />
                      {amountError && (
                        <p className="text-red-400 text-[11px] mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {amountError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ml-1 transition-colors ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => {
                          setBankName(e.target.value);
                          setBankError(null);
                        }}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all font-semibold ${
                          isDarkMode 
                            ? 'bg-[#070B1A] text-slate-200 border-slate-800 focus:border-indigo-500' 
                            : 'bg-slate-50 text-slate-800 border-slate-250 focus:border-indigo-500'
                        } ${bankError ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="e.g. ICICI"
                      />
                      {bankError && (
                        <p className="text-red-400 text-[11px] mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {bankError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ml-1 transition-colors ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setPhoneError(null);
                        }}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all font-semibold ${
                          isDarkMode 
                            ? 'bg-[#070B1A] text-slate-200 border-slate-800 focus:border-indigo-500' 
                            : 'bg-slate-50 text-slate-800 border-slate-250 focus:border-indigo-500'
                        } ${phoneError ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {phoneError && (
                        <p className="text-red-400 text-[11px] mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {phoneError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ml-1 transition-colors ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Due Date
                      </label>
                      <input
                        type="text"
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value);
                          setDateError(null);
                          setDateWarning(null);
                        }}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all font-semibold ${
                          isDarkMode 
                            ? 'bg-[#070B1A] text-slate-200 border-slate-800 focus:border-indigo-500' 
                            : 'bg-slate-50 text-slate-800 border-slate-250 focus:border-indigo-500'
                        } ${
                          dateError
                            ? 'border-red-500 focus:border-red-500'
                            : dateWarning
                            ? 'border-amber-500 focus:border-amber-500'
                            : ''
                        }`}
                        placeholder="e.g. June 15, 2026"
                      />
                      {dateError && (
                        <p className="text-red-400 text-[11px] mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {dateError}
                        </p>
                      )}
                      {dateWarning && !dateError && (
                        <p className="text-amber-400 text-[11px] mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {dateWarning}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Voice Configuration */}
                  <div className="mt-3.5 border-t border-slate-800/40 pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ml-1 transition-colors ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Voice Engine
                        </label>
                        <select
                          value={voiceEngine}
                          onChange={(e) => setVoiceEngine(e.target.value)}
                          disabled={isProcessing || isCallActive}
                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all font-semibold cursor-pointer ${
                            isDarkMode 
                              ? 'bg-[#070B1A] text-slate-200 border-slate-800 focus:border-indigo-500' 
                              : 'bg-slate-50 text-slate-800 border-slate-250 focus:border-indigo-500'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="sarvam">Sarvam AI</option>
                          <option value="gtts">gTTS</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ml-1 transition-colors ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Voice
                        </label>
                        <select
                          value={voiceGender}
                          onChange={(e) => setVoiceGender(e.target.value)}
                          disabled={isProcessing || isCallActive}
                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all font-semibold cursor-pointer ${
                            isDarkMode 
                              ? 'bg-[#070B1A] text-slate-200 border-slate-800 focus:border-indigo-500' 
                              : 'bg-slate-50 text-slate-800 border-slate-250 focus:border-indigo-500'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {voiceEngine === 'sarvam' ? (
                            <>
                              <option value="male">Sarvam Male</option>
                              <option value="female">Sarvam Female</option>
                            </>
                          ) : (
                            <>
                              <option value="male">gTTS Male</option>
                              <option value="female">gTTS Female</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full mt-4.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#5A52FF] hover:to-[#8B4CFF] text-white font-bold py-2.5 px-5 rounded-xl transition duration-150 transform active:scale-[0.98] shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 tracking-widest uppercase text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Triggering Call...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>Trigger Call Outbound</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* Live Call Simulation Panel */
            <motion.div
              key="call-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >


              {/* CENTER DISPLAY PANEL (Voice Screen & Visualizations) */}
              <section className={`flex-1 flex flex-col justify-between relative z-20 transition-colors duration-300 ${
                isDarkMode ? 'bg-[#070B1A]' : 'bg-slate-100'
              }`}>
                {/* Visual Error notification */}
                {recognitionError && (
                  <div className="absolute top-4 inset-x-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-4 py-3.5 rounded-xl z-50 flex items-center gap-2.5 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{recognitionError}</span>
                  </div>
                )}

                {/* Call Screen Center Piece */}
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  {/* Large Circular AI Avatar */}
                  <div className="relative mb-6">
                    {/* Glowing outer rings based on voice state */}
                    <AnimatePresence>
                      {isSpeaking && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: [1.1, 1.25, 1.1] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute inset-[-20px] rounded-full border border-[#F5A623]/20 bg-[#F5A623]/5 shadow-[0_0_60px_rgba(245,166,35,0.15)] pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isListening && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: [1.15, 1.3, 1.15] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute inset-[-25px] rounded-full border border-red-500/20 bg-red-500/5 shadow-[0_0_60px_rgba(239,68,68,0.15)] pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isThinking && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, rotate: 360 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-[-15px] rounded-full border-2 border-dashed border-[#7C3AED]/30 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    {/* Core Avatar */}
                    <motion.div
                      animate={
                        isSpeaking
                          ? { scale: [1, 1.04, 1] }
                          : isListening
                          ? { scale: [1, 1.02, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 1.2, repeat: isSpeaking ? Infinity : 0, ease: 'easeInOut' }}
                      className={`w-36 h-36 rounded-full flex items-center justify-center relative shadow-2xl border ${
                        isSpeaking
                          ? 'bg-gradient-to-br from-[#F5A623]/10 to-[#EA580C]/10 border-[#F5A623]/40'
                          : isListening
                          ? 'bg-gradient-to-br from-red-500/10 to-rose-600/10 border-red-500/40'
                          : isThinking
                          ? 'bg-gradient-to-br from-[#7C3AED]/10 to-indigo-600/10 border-[#7C3AED]/40'
                          : isDarkMode
                          ? 'bg-[#111827] border-slate-800'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      {isSpeaking ? (
                        <Sparkles className="w-12 h-12 text-[#F5A623] animate-pulse" />
                      ) : isListening ? (
                        <Mic className="w-12 h-12 text-red-400 animate-pulse" />
                      ) : isThinking ? (
                        <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin" />
                      ) : isOnHold ? (
                        <Pause className="w-12 h-12 text-amber-500" />
                      ) : (
                        <User className={`w-12 h-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                      )}
                    </motion.div>
                  </div>

                  {/* Agent Info Details */}
                  <div className="text-center">
                    <h3 className={`text-xl font-bold tracking-wide transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-slate-800'
                    }`}>
                      {isSpeaking ? 'BankConnect Assistant Speaking' : isListening ? 'Listening...' : isThinking ? 'Analyzing Response...' : isOnHold ? 'Call On Hold' : 'BankConnect Assistant'}
                    </h3>
                    <p className={`text-xs mt-1 flex items-center justify-center gap-1.5 font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {isOnHold ? (
                        <span className="text-amber-500">HOLD</span>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-[#4F46E5] animate-ping"></span>
                          <span className="text-indigo-400">CONNECTED</span>
                        </>
                      )}
                      <span className={isDarkMode ? 'text-slate-700' : 'text-slate-300'}>|</span>
                      <span>Audio quality: Excellent</span>
                    </p>
                  </div>

                  {/* Dynamic payment link display during active call */}
                  <AnimatePresence>
                    {paymentLink && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className={`w-full max-w-[340px] mt-6 p-4 border rounded-2xl transition-colors duration-300 shadow-lg z-20 ${
                          isDarkMode
                            ? 'bg-[#111827]/80 border-slate-800 text-white'
                            : 'bg-white border-slate-200 text-slate-800 shadow-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                            Demo Payment Link
                          </span>
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Payment Link Sent
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={paymentLink}
                            className={`flex-1 border rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none transition-all font-mono select-all ${
                              isDarkMode
                                ? 'bg-[#070B1A] text-slate-350 border-slate-800'
                                : 'bg-slate-50 text-slate-650 border-slate-200'
                            }`}
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentLink);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className={`p-1.5 border rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:scale-105 active:scale-95 ${
                              copied
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : isDarkMode
                                ? 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Copy Link"
                          >
                            {copied ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>
                          <a
                            href={paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 border rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:scale-105 active:scale-95 ${
                              isDarkMode
                                ? 'bg-[#1E2940] border-slate-800 text-indigo-400 hover:text-indigo-300'
                                : 'bg-indigo-50 border-indigo-100 text-indigo-650 hover:bg-indigo-100/60'
                            }`}
                            title="Open Link"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Large Waveform Voice Visualizer */}
                  <div className="w-full max-w-[280px] h-12 flex items-center justify-center gap-1 mt-8 overflow-hidden">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isSpeaking
                            ? 'bg-[#F5A623] waveform-bar'
                            : isListening
                            ? 'bg-red-500 waveform-bar'
                            : isThinking
                            ? 'bg-[#7C3AED]/40 h-1.5'
                            : isDarkMode
                            ? 'bg-slate-800 h-1'
                            : 'bg-slate-300 h-1'
                        }`}
                        style={
                          isSpeaking || isListening
                            ? {
                                animationDelay: `${i * 0.08}s`,
                                height: '6px'
                              }
                            : {}
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Control Bar Area */}
                <div className={`p-6 border-t flex flex-col items-center justify-center z-20 transition-colors duration-300 ${
                  isDarkMode ? 'bg-[#0E1326]/80 border-t-slate-800/80' : 'bg-white border-t-slate-200 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]'
                }`}>
                  <div className="flex items-center gap-6">
                    {/* Mute Button */}
                    <button
                      onClick={handleMuteToggle}
                      title={isMuted ? "Unmute Mic" : "Mute Mic"}
                      className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        isMuted
                          ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-md shadow-red-500/5'
                          : isDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-sm'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Prominent Red End Call Button */}
                    {!isTerminal && (
                      <button
                        onClick={handleEndCall}
                        title="End Call"
                        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-750 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-red-650/20"
                      >
                        <PhoneOff className="w-6 h-6" />
                      </button>
                    )}

                    {/* Hold / Pause Button */}
                    <button
                      onClick={handleHoldToggle}
                      title={isOnHold ? "Resume Call" : "Put on Hold"}
                      className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        isOnHold
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-md'
                          : isDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-sm'
                      }`}
                    >
                      {isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </section>

              {/* RIGHT SIDE PANEL (30% width) - Live Interactive Transcript Cards */}
              <aside className={`w-[30%] min-w-[300px] border-l p-5 flex flex-col overflow-hidden z-20 transition-colors duration-300 ${
                isDarkMode ? 'border-slate-850 bg-[#0A0E20]/50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <h2 className={`text-xs uppercase font-bold tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Live Call Transcript
                  </h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 py-1 scroll-smooth">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border relative flex flex-col gap-2 transition-all duration-300 ${
                        msg.sender === 'user'
                          ? (isDarkMode ? 'bg-[#1E1B4B]/60 border-[#4F46E5]/30' : 'bg-indigo-50/50 border-indigo-100/80')
                          : (isDarkMode ? 'bg-[#111827]/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm')
                      }`}
                    >
                      {/* Message header details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase ${
                            msg.sender === 'user'
                              ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600')
                              : (isDarkMode ? 'text-[#F5A623]' : 'text-amber-600')
                          }`}>
                            {msg.sender === 'user' ? 'Customer' : 'BankConnect Assistant'}
                          </span>
                          <span className={`text-[9px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{msg.timestamp}</span>
                        </div>

                        {/* Replay button for bot responses */}
                        {msg.sender === 'bot' && (msg.audio_url || isMockMode) && (
                          <button
                            onClick={(e) => handleReplay(e, msg)}
                            disabled={isSpeaking}
                            title="Replay Audio"
                            className={`p-1 rounded text-xs transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border ${
                              isDarkMode
                                ? 'bg-slate-900 border-slate-800 text-[#F5A623] hover:text-white hover:bg-slate-800'
                                : 'bg-slate-55 border-slate-200 text-amber-600 hover:text-amber-800 hover:bg-slate-100'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Message Text */}
                      <p
                        className={`text-xs leading-relaxed font-sans ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
                        style={{ fontFamily: "'Noto Sans Devanagari', 'Outfit', system-ui" }}
                      >
                        {msg.text}
                      </p>

                    </motion.div>
                  ))}

                  {/* Thinking status card inside transcript */}
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-3 border rounded-xl text-center text-xs flex items-center justify-center gap-2 transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-[#111827]/40 border-slate-850 text-slate-400'
                          : 'bg-slate-100/60 border-slate-200 text-slate-600'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Analyzing response intent...</span>
                    </motion.div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

              </aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. CALL ENDED SUMMARY OVERLAY */}
        <AnimatePresence>
          {isTerminal && callSummary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-y-auto transition-colors duration-300 ${
                isDarkMode ? 'bg-[#070B1A]/95' : 'bg-slate-900/60'
              }`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`w-full max-w-[560px] border rounded-[28px] p-8 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
                  isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-2xl'
                }`}
              >
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-600/10 rounded-full blur-[50px]"></div>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className={`text-2xl font-bold tracking-wide transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-[#0F172A]'
                  }`}>Call Simulation Finished</h2>
                  <p className={`text-xs mt-1 uppercase tracking-wider font-semibold ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    System Disposition & Outcomes
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`border p-3.5 rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#070B1A] border-slate-850' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <span className={`text-[9px] uppercase font-bold block tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Duration</span>
                      <span className={`text-sm font-semibold mt-1 block flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> {callSummary.duration}
                      </span>
                    </div>
                    <div className={`border p-3.5 rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#070B1A] border-slate-850' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <span className={`text-[9px] uppercase font-bold block tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PTP Status</span>
                      <span className={`text-sm font-bold mt-1 block ${
                        callSummary.promiseToPay === 'Yes' 
                          ? 'text-emerald-400' 
                          : (isDarkMode ? 'text-slate-400' : 'text-slate-500')
                      }`}>
                        {callSummary.promiseToPay}
                      </span>
                    </div>
                    <div className={`border p-3.5 rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#070B1A] border-slate-850' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <span className={`text-[9px] uppercase font-bold block tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Disposition Outcome</span>
                      <span className={`text-xs font-semibold mt-1 block ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{callSummary.outcome}</span>
                    </div>
                    <div className={`border p-3.5 rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#070B1A] border-slate-850' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <span className={`text-[9px] uppercase font-bold block tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customer Sentiment</span>
                      <span className={`text-xs font-semibold mt-1 block ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{callSummary.sentiment}</span>
                    </div>
                  </div>

                  {/* Summary text */}
                  <div className={`border p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#070B1A] border-slate-850' : 'bg-slate-50 border-slate-150'
                  }`}>
                    <span className={`text-[9px] uppercase font-bold tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Call Summary Log</span>
                    <p className={`text-xs leading-relaxed mt-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{callSummary.summaryText}</p>
                  </div>

                  {/* Demo Payment Link Section */}
                  <div className={`border p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#070B1A] border-slate-850' : 'bg-slate-50 border-slate-150'
                  }`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`text-[9px] uppercase font-bold tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Demo Payment Link
                      </span>
                      {paymentLinkSent ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Payment Link Sent
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                            Not Sent
                          </span>
                          <button
                            onClick={() => {
                              const generatedLink = `https://pay.bankconnect.mock/pay/${sessionId || 'summary'}?amt=${amount}&cust=${encodeURIComponent(customerName)}&bk=${encodeURIComponent(bankName)}`;
                              setPaymentLink(generatedLink);
                              setPaymentLinkSent(true);
                            }}
                            className="px-2.5 py-0.5 text-[9px] font-bold rounded bg-indigo-650 hover:bg-indigo-700 text-white cursor-pointer transition-colors active:scale-95"
                          >
                            Send Again
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={paymentLink || `https://pay.bankconnect.mock/pay/${sessionId || 'summary'}?amt=${amount}&cust=${encodeURIComponent(customerName)}&bk=${encodeURIComponent(bankName)}`}
                        className={`flex-1 border rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none transition-all font-mono select-all ${
                          isDarkMode
                            ? 'bg-[#070B1A] text-slate-350 border-slate-800'
                            : 'bg-slate-50 text-slate-650 border-slate-200'
                        }`}
                      />
                      <button
                        onClick={() => {
                          const link = paymentLink || `https://pay.bankconnect.mock/pay/${sessionId || 'summary'}?amt=${amount}&cust=${encodeURIComponent(customerName)}&bk=${encodeURIComponent(bankName)}`;
                          navigator.clipboard.writeText(link);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className={`p-1.5 border rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:scale-105 active:scale-95 ${
                          copied
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-405'
                            : isDarkMode
                            ? 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Copy Link"
                      >
                        {copied ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                      <a
                        href={paymentLink || `https://pay.bankconnect.mock/pay/${sessionId || 'summary'}?amt=${amount}&cust=${encodeURIComponent(customerName)}&bk=${encodeURIComponent(bankName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1.5 border rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:scale-105 active:scale-95 ${
                          isDarkMode
                            ? 'bg-[#1E2940] border-slate-800 text-indigo-400 hover:text-indigo-300'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-650 hover:bg-indigo-100/60'
                        }`}
                        title="Open Link"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleRestart}
                      className={`flex-1 font-bold py-3.5 px-4 rounded-xl transition duration-150 transform active:scale-[0.98] text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow border ${
                        isDarkMode
                          ? 'bg-[#1E2940] hover:bg-[#2A3754] border-slate-800 text-slate-200 hover:text-white'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" /> Start New Call
                    </button>
                    <div className="flex-1 relative">
                      <button
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        className="w-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#5A52FF] hover:to-[#8B4CFF] text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 transform active:scale-[0.98] text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                      >
                        <Download className="w-4 h-4" /> Export Summary
                      </button>
                      
                      <AnimatePresence>
                        {showExportDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute bottom-full mb-2 right-0 left-0 border rounded-xl shadow-xl z-50 overflow-hidden ${
                              isDarkMode ? 'bg-[#0E1326] border-slate-800' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="p-1.5 flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  exportCallSummary('pdf');
                                  setShowExportDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-lg transition duration-150 flex items-center gap-2 cursor-pointer ${
                                  isDarkMode ? 'text-slate-200 hover:text-white hover:bg-slate-800/80' : 'text-slate-700 hover:text-[#0F172A] hover:bg-slate-100'
                                }`}
                              >
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Export as PDF
                              </button>
                              <button
                                onClick={() => {
                                  exportCallSummary('txt');
                                  setShowExportDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-lg transition duration-150 flex items-center gap-2 cursor-pointer ${
                                  isDarkMode ? 'text-slate-200 hover:text-white hover:bg-slate-800/80' : 'text-slate-700 hover:text-[#0F172A] hover:bg-slate-100'
                                }`}
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Export as TXT
                              </button>
                              <button
                                onClick={() => {
                                  exportCallSummary('json');
                                  setShowExportDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-lg transition duration-150 flex items-center gap-2 cursor-pointer ${
                                  isDarkMode ? 'text-slate-200 hover:text-white hover:bg-slate-800/80' : 'text-slate-700 hover:text-[#0F172A] hover:bg-slate-100'
                                }`}
                              >
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Export as JSON
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
 


