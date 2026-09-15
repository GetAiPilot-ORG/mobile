const fs = require('fs');
const modalPath = 'c:\\Users\\win\\Desktop\\Metabulluniverse\\GetAiPilot\\mobile\\src\\features\\telegram\\components\\ReportBotModal.tsx';
const screenPath = 'c:\\Users\\win\\Desktop\\Metabulluniverse\\GetAiPilot\\mobile\\src\\features\\telegram\\screens\\ReportBotScreen.tsx';

let content = fs.readFileSync(modalPath, 'utf8');

// Ensure TelegramToolKey is imported
if (!content.includes('TelegramToolKey')) {
  content = content.replace(/import \{ ReportBotBrandProfile \} from '\.\.\/types';/, "import { ReportBotBrandProfile, TelegramToolKey } from '../types';");
}

// Replace Interface
content = content.replace(/interface ReportBotModalProps \{[\s\S]*?\}/, 'interface Props { onOpenModal: (key: TelegramToolKey) => void; }');

// Replace Component signature
content = content.replace(/export const ReportBotModal: React\.FC<ReportBotModalProps> = \(\{ visible, onClose \}\) => \{/, 'export const ReportBotScreen: React.FC<Props> = ({ onOpenModal }) => {');

// Remove ONLY the first Modal wrapper
content = content.replace(/<Modal visible=\{visible\} animationType="slide" presentationStyle="pageSheet" onRequestClose=\{onClose\}>/, '<View style={{ flex: 1, paddingBottom: 110 }}>');

// Replace ONLY the last </Modal>
const lastModalIndex = content.lastIndexOf('</Modal>');
if (lastModalIndex !== -1) {
  content = content.substring(0, lastModalIndex) + '</View>' + content.substring(lastModalIndex + 8);
}

// Remove Close Button (the one associated with the main wrapper)
content = content.replace(/<Pressable style=\{\[styles\.closeBtn, isDark \? styles\.closeBtnDark : styles\.closeBtnLight\]\} onPress=\{onClose\}>[\s\S]*?<\/Pressable>/, '');

// Change enabled query
content = content.replace(/enabled: visible,/g, 'enabled: true,');

fs.writeFileSync(screenPath, content);
console.log('Fixed ReportBotScreen completely!');
