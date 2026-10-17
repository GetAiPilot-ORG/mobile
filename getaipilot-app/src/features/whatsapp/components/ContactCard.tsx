import React from 'react';
import { ProductRow } from '@/components/ProductUI';
import { UserIcon } from '@/constants/icons';
import { WhatsAppContact } from '../types';

interface ContactCardProps { contact: WhatsAppContact; onOpenChat?: (contact: WhatsAppContact) => void; }

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onOpenChat }) =>
  <ProductRow title={contact.name || contact.phone} detail={[contact.phone, ...(contact.tags || []).slice(0, 2)].join(' · ')} icon={UserIcon} tone="mint" onPress={onOpenChat ? () => onOpenChat(contact) : undefined} />;
