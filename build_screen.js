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

// Remove Modal wrapper
content = content.replace(/<Modal visible=\{visible\} animationType="slide" presentationStyle="pageSheet" onRequestClose=\{onClose\}>/g, '<View style={{ flex: 1, paddingBottom: 110 }}>');
content = content.replace(/<\/Modal>/g, '</View>');

// Remove Close Button
content = content.replace(/<Pressable style=\{\[styles\.closeBtn, isDark \? styles\.closeBtnDark : styles\.closeBtnLight\]\} onPress=\{onClose\}>[\s\S]*?<\/Pressable>/g, '');

// Change enabled query
content = content.replace(/enabled: visible,/g, 'enabled: true,');

// Modify the body height style if needed, but flex: 1 should handle it.

fs.writeFileSync(screenPath, content);
console.log('Successfully ported ReportBotModal to ReportBotScreen');
