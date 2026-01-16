// cspell:ignore WHATSAPP
import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { WorkshopContext } from '../App';
import { WorkshopOrder, OSStatus, Priority, VehicleCategory, ChecklistItem, OrderItem, OrderDocument } from '../types';
import { X, ArrowRight, Activity, Wrench, Package, History, Briefcase, UserCheck, Sparkles, FileText, Printer, Share2, Save, CheckCircle2, Calendar, ListChecks, Plus, Trash2, Clock, AlertCircle, ShoppingCart, Upload, File as FileIcon, Image as ImageIcon, Eye, Undo2, Download, CreditCard, FileSignature } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { uploadDocument, deleteDocument } from '../services/supabase'; // We need to import these locally if not in context, or add to context. 
// Ideally should be in context, but for speed I will use direct import or ask user to add to context.
import { uploadDocument as uploadDocService, deleteDocument as deleteDocService, addOrderItem as addOrderItemService, updateOrderItem as updateOrderItemService, deleteOrderItem as deleteOrderItemService, } from '../services/supabase';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../constants';

interface OSDetailsModalProps {
  order: WorkshopOrder;
  onClose: () => void;
}

const PrintStyles = () => (
  <style>{`
    @media print {
      @page { margin: 0; size: auto; }
      body * {
        visibility: hidden;
      }
      #print-layout-v3, #print-layout-v3 * {
        visibility: visible;
      }
      #print-layout-v3 {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        z-index: 9999 !important;
        background: white !important;
        opacity: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        visibility: visible !important;
      }
      #whatsapp-pdf-content {
        width: 210mm !important;
        min-height: 296mm !important;
        margin: 0 auto !important;
        padding: 20mm !important;
        box-shadow: none !important;
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
    }
  `}</style>
);

const OSDetailsModal: React.FC<OSDetailsModalProps> = ({ order: initialOrder, onClose }) => {
  const context = useContext(WorkshopContext);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'documents' | 'history'>('details');
  const [localDiagnosis, setLocalDiagnosis] = useState(initialOrder.diagnosis || '');
  const [discount, setDiscount] = useState<number>(initialOrder.discount || 0);
  const [discountType, setDiscountType] = useState<'value' | 'percent'>(initialOrder.discountType || 'value');
  const [localNotes, setLocalNotes] = useState(initialOrder.notes || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [tempMechanicId, setTempMechanicId] = useState(initialOrder.mechanicId || '');
  const [tempDate, setTempDate] = useState(() => {
    const d = new Date();
    // If it's past 18:00 (closing time), suggest next day
    if (d.getHours() >= 18) {
      d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [tempTime, setTempTime] = useState('');
  const [previewDoc, setPreviewDoc] = useState<OrderDocument | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Payment Method State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // Documents State
  const [documents, setDocuments] = useState<import('../types').OrderDocument[]>(initialOrder.documents || []);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState(''); // Custom name for the file
  const [docToDelete, setDocToDelete] = useState<OrderDocument | null>(null); // State for doc deletion confirmation

  // WhatsApp Modal State
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean;
    step: 'confirm' | 'processing' | 'success' | 'error';
    message?: string;
  }>({ isOpen: false, step: 'confirm' });

  const handleWhatsAppProcess = async () => {
    setWhatsappModal(prev => ({ ...prev, step: 'processing' }));

    try {
      // 1. Generate PDF
      const wrapper = document.getElementById('print-layout-v3');
      const element = document.getElementById('whatsapp-pdf-content');
      if (!wrapper || !element) throw new Error("Conteúdo do orçamento não encontrado.");

      // 1b. Enhanced Strategy: Clone and Isolate
      // 1b. Enhanced Strategy: Live Fullscreen Overlay
      // Instead of cloning (which loses styles/images), we force the live wrapper
      // to cover the entire screen with a white background, ensuring clean capture.

      const prevStyle = {
        opacity: wrapper.style.opacity,
        zIndex: wrapper.style.zIndex,
        position: wrapper.style.position,
        top: wrapper.style.top,
        left: wrapper.style.left,
        background: wrapper.style.background,
        width: wrapper.style.width,
        height: wrapper.style.height,
        display: wrapper.style.display,
        justifyContent: wrapper.style.justifyContent
      };

      // Force Wrapper to be visible, full screen, white background, on top of EVERYTHING
      wrapper.style.opacity = '1';
      wrapper.style.zIndex = '2147483647'; // Max Z-Index
      wrapper.style.position = 'fixed';
      wrapper.style.top = '0';
      wrapper.style.left = '0';
      wrapper.style.width = '100vw';
      wrapper.style.height = '100vh';
      wrapper.style.background = '#ffffff';
      wrapper.style.display = 'flex';
      wrapper.style.justifyContent = 'center'; // Center the A4 page
      wrapper.style.overflow = 'hidden'; // Prevent internal scroll bars affecting capture

      const filename = `Orcamento_${vehicle?.plate || 'MP'}_${order.id}.pdf`;
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      let blob;
      try {
        // Generate from the element (which is now centered on a white fullscreen background)
        blob = await html2pdf().set(opt).from(element).output('blob');
      } finally {
        // Restore original styles
        wrapper.style.opacity = prevStyle.opacity;
        wrapper.style.zIndex = prevStyle.zIndex;
        wrapper.style.position = prevStyle.position;
        wrapper.style.top = prevStyle.top;
        wrapper.style.left = prevStyle.left;
        wrapper.style.background = prevStyle.background;
        wrapper.style.width = prevStyle.width;
        wrapper.style.height = prevStyle.height;
        wrapper.style.display = prevStyle.display;
        wrapper.style.justifyContent = prevStyle.justifyContent;
        wrapper.style.overflow = '';
      }

      // 2. Upload to Documents
      const file = new File([blob], filename, { type: 'application/pdf' });
      const { data: newDoc, error } = await uploadDocService(order.id, file, filename);

      if (error) throw new Error(error);

      if (newDoc) {
        setDocuments(prev => [...prev, newDoc]);
        updateOrder(order.id, { documents: [...(order.documents || []), newDoc] });
      }

      // 3. Prepare Message
      const defaultTemplate = "Olá {CLIENTE}, segue o orçamento do seu {VEICULO} ({PLACA}).\n\n*Total: {VALOR}*";
      const template = settings?.whatsappMessageTemplate || defaultTemplate;

      let message = template
        .replace(/{CLIENTE}/g, client?.name || 'Cliente')
        .replace(/{VEICULO}/g, vehicle?.model || 'Veículo')
        .replace(/{PLACA}/g, vehicle?.plate || '')
        .replace(/{VALOR}/g, `R$ ${totalValue.toLocaleString()}`);

      if (newDoc?.url) {
        message += `\n\n📄 *Link do Orçamento:* ${newDoc.url}`;
      } else {
        throw new Error("Erro ao obter link do documento.");
      }

      // 4. Success & Open
      setWhatsappModal({ isOpen: true, step: 'success', message: 'PDF gerado e link anexado!' });
      addHistoryLog(order.id, 'WHATSAPP', 'Gerou Link PDF e enviou');

      setTimeout(() => {
        const phone = client?.phone?.replace(/\D/g, '') || '';
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
        setWhatsappModal({ isOpen: false, step: 'confirm' });
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setWhatsappModal({ isOpen: true, step: 'error', message: err.message || "Erro desconhecido" });
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;

    try {
      await deleteDocService(docToDelete.id, docToDelete.url);

      const newDocs = documents.filter(d => d.id !== docToDelete.id);
      setDocuments(newDocs);
      updateOrder(order.id, { documents: newDocs });
      addHistoryLog(order.id, 'DOCUMENTO', `Removeu documento: ${docToDelete.name}`);
      setDocToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir documento.');
    }
  };

  // Estados para adição de itens (Orçamento)
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemType, setNewItemType] = useState<'PART' | 'SERVICE'>('PART');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newObservation, setNewObservation] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [revertModal, setRevertModal] = useState<{ isOpen: boolean; targetStatus: OSStatus; label: string; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{ isOpen: boolean; title: string; message: string; warnings: string[] } | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; confirmLabel?: string } | null>(null);
  const [showBudgetSentModal, setShowBudgetSentModal] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false); // New state for rescheduling mode
  const [isWaitingParts, setIsWaitingParts] = useState(false);
  const [daysToArrive, setDaysToArrive] = useState(2);
  const [showPriceError, setShowPriceError] = useState(false);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden'; // Lock scroll

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset'; // Unlock scroll
    };
  }, [onClose]);

  if (!context) return null;
  const { vehicles, clients, orders, inventory, services, mechanics, updateOrderStatus, updateOrder, history, addHistoryLog, gearboxes, settings, deleteOrder, paymentMethods } = context;

  const order = context.orders.find(o => o.id === initialOrder.id) || initialOrder;
  const vehicle = vehicles.find(v => v.id === order.vehicleId);
  const client = vehicle ? clients.find(c => c.id === vehicle.clientId) : null;
  // Group consecutive identical history logs (e.g. repeated prints)
  const orderHistory = useMemo(() => {
    const sorted = history
      .filter(h => h.orderId === order.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const grouped: (typeof sorted[0] & { count: number })[] = [];

    sorted.forEach(log => {
      const last = grouped[grouped.length - 1];
      // Check if identical to the previous one (which is actually the newer one due to sort order, but consistent in list)
      // We group if Action + Content is same.
      // We also verify if it's the "same day" to avoid grouping things days apart? 
      // User asked to "clean up", usually repeated prints happen in session.
      // Let's strict equality on content.

      if (last && last.action === log.action && last.diff === log.diff) {
        last.count = (last.count || 1) + 1;
      } else {
        grouped.push({ ...log, count: 1 });
      }
    });

    return grouped;
  }, [history, order.id]);

  // Find linked gearbox/engine to get assembly time (match by vehicle brand)
  const gearbox = vehicle ? gearboxes.find(e => e.brand.toLowerCase() === vehicle.brand.toLowerCase()) : null;

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const subtotalValue = useMemo(() => order.items?.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) || 0, [order.items]);
  const discountValue = useMemo(() => discountType === 'value' ? discount : (subtotalValue * discount / 100), [subtotalValue, discount, discountType]);
  const totalValue = subtotalValue - discountValue;

  const slotStatus = useMemo(() => {
    if (!tempMechanicId || !tempDate) return {};

    const statusMap: Record<string, { state: 'free' | 'busy' | 'partial_start', startAt?: string }> = {};
    const dayOrders = orders.filter(o => o.mechanicId === tempMechanicId && o.scheduledDate?.startsWith(tempDate));

    // Helper to Convert HH:MM to minutes
    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    timeSlots.forEach(slot => {
      const slotStart = toMins(slot);
      const slotEnd = slotStart + 60;
      let occupiedStart = slotStart;
      let occupiedEnd = slotStart;

      // Check overlaps
      let isFullyOccupied = false;
      let isPartiallyOccupied = false;

      dayOrders.forEach(o => {
        if (!o.scheduledDate) return;
        const osTime = o.scheduledDate.split('T')[1].substring(0, 5);
        const osStart = toMins(osTime);
        const duration = o.estimatedDuration || 60;
        const osEnd = osStart + duration;

        // Check Intersection
        if (osStart < slotEnd && osEnd > slotStart) {
          // Overlapping
          if (osStart <= slotStart && osEnd >= slotEnd) {
            isFullyOccupied = true;
          } else if (osStart <= slotStart && osEnd > slotStart && osEnd < slotEnd) {
            // Occupies the beginning of the slot (e.g. 13:00 -> 13:30)
            if (osEnd - slotStart >= 30) {
              // At least 30 mins occupied from start
              isPartiallyOccupied = true;
              occupiedEnd = Math.max(occupiedEnd, osEnd);
            }
          }
        }
      });

      if (isFullyOccupied) {
        statusMap[slot] = { state: 'busy' };
      } else if (isPartiallyOccupied) {
        // Assuming 30 min granularity for now as requested
        statusMap[slot] = { state: 'partial_start', startAt: `${slot.split(':')[0]}:30` };
      } else {
        statusMap[slot] = { state: 'free' };
      }
    });

    return statusMap;
  }, [orders, tempMechanicId, tempDate, timeSlots]);


  // End of SlotStatus logic

  const isFinished = order.status === OSStatus.FINISHED;



  const getNextStatus = (current: OSStatus): OSStatus | null => {
    // Define exact sequence compatible with OSStatus enum
    const seq: OSStatus[] = [
      OSStatus.BUDGET,
      OSStatus.APPROVAL,
      OSStatus.SCHEDULED,
      OSStatus.EXECUTION,
      OSStatus.FINISHED
    ];

    const idx = seq.indexOf(current);
    if (idx === -1) return null; // Handle unexpected or RECEPTION
    return idx < seq.length - 1 ? seq[idx + 1] : null;
  };

  const targetStatus = getNextStatus(order.status);
  const showItemsTab = true;

  const handleRevert = () => {
    const seq: OSStatus[] = [
      OSStatus.BUDGET,
      OSStatus.APPROVAL,
      OSStatus.SCHEDULED,
      OSStatus.EXECUTION,
      OSStatus.FINISHED
    ];
    const idx = seq.indexOf(order.status);
    if (idx <= 0) return;

    const prevStatus = seq[idx - 1];
    const prevLabel = STATUS_CONFIG[prevStatus].label;

    let message = `Deseja estornar o status para ${prevLabel}?`;
    if (order.status === OSStatus.SCHEDULED && prevStatus === OSStatus.APPROVAL) {
      message = "Deseja voltar para aprovação do cliente e excluir o agendamento?";
    }

    setRevertModal({ isOpen: true, targetStatus: prevStatus, label: prevLabel, message });
  };

  const confirmRevert = () => {
    if (!revertModal) return;

    // Financial Integration: Remove Transaction if reverting from FINISHED
    if (order.status === OSStatus.FINISHED) {
      const transaction = context.transactions.find(t => t.orderId === order.id);
      if (transaction) {
        context.deleteTransaction(transaction.id);
        addHistoryLog(order.id, 'FINANCEIRO', `Estorno: Removeu receita de R$ ${transaction.amount.toFixed(2)}`);
      }
    }

    // Perform status update
    updateOrderStatus(order.id, revertModal.targetStatus);

    // Clear scheduling data if reverting from SCHEDULED
    if (order.status === OSStatus.SCHEDULED) {
      // Use null to explicitly clear the fields in the database
      updateOrder(order.id, { scheduledDate: null, mechanicId: null } as any);
    }

    addHistoryLog(order.id, 'ESTORNO', `Estornou para ${revertModal.label}`);
    setRevertModal(null);
    onClose();
  };

  const handleAdvance = () => {
    // Validate Budget Share for 'Enviar para Aprovação' (Status BUDGET -> APPROVAL)
    if (order.status === OSStatus.BUDGET) {
      if (!order.items || order.items.length === 0) {
        setAlertModal({
          isOpen: true,
          title: "Orçamento Vazio",
          message: "Não é possível enviar um orçamento vazio.\nAdicione itens antes de prosseguir.",
          type: 'error'
        });
        return;
      }

      const hasShared = orderHistory.some(h =>
        h.action === 'IMPRESSÃO' ||
        h.action === 'WHATSAPP' ||
        h.diff?.includes('Imprimiu Orçamento') ||
        h.diff?.includes('Enviou Orçamento')
      );

      if (!hasShared) {
        setAlertModal({
          isOpen: true,
          title: "Não Enviado",
          message: "O orçamento ainda não foi impresso ou enviado.\n\nPor favor, imprima ou envie via WhatsApp antes de solicitar aprovação.",
          type: 'warning'
        });
        return;
      }

      // Show confirmation modal
      setShowBudgetSentModal(true);
      return;
    }

    if (order.status === OSStatus.SCHEDULED) {
      setConfirmModal({
        isOpen: true,
        title: "Iniciar Execução",
        message: "Deseja avançar o status para Em Execução?",
        confirmLabel: "Sim, Iniciar",
        onConfirm: () => {
          setConfirmModal(null);
          finalizeStageChange();
        }
      });
      return;
    }

    if (order.status === OSStatus.EXECUTION) {
      setPaymentModalOpen(true);
      return;
    }

    if (order.status === OSStatus.APPROVAL) {
      setShowApprovalModal(true);
    } else {
      finalizeStageChange();
    }
  };

  const finalizeStageChange = () => {
    if (!targetStatus && !isRescheduling) return;

    // Conflict Detection
    if (showScheduling && tempTime && tempDate) {
      const [y, m, d] = tempDate.split('-').map(Number);
      const isoDate = tempDate;

      // Check for Past Date/Time
      const [sH, sMin] = tempTime.split(':').map(Number);
      const selectedDateTime = new Date(y, m - 1, d, sH, sMin);
      const now = new Date();

      if (selectedDateTime < now) {
        setAlertModal({
          isOpen: true,
          title: "Horário Inválido",
          message: `Não é possível agendar para o passado.\nData selecionada: ${selectedDateTime.toLocaleString('pt-BR')}`,
          type: 'error'
        });
        return;
      }

      // Current proposed slot
      const [h, min] = tempTime.split(':').map(Number);
      const newStart = h * 60 + min;
      const newDuration = order.estimatedDuration || 60; // Use current estimated duration
      const newEnd = newStart + newDuration;

      // Find conflicting orders
      const conflictingOrder = orders.find(o => {
        // Skip current order
        if (o.id === order.id) return false;
        // Check same mechanic
        if (o.mechanicId !== tempMechanicId) return false;
        // Check same day
        if (!o.scheduledDate?.startsWith(isoDate)) return false;

        // Calculate existing order time range
        const osTime = o.scheduledDate.split('T')[1].substring(0, 5);
        const [oh, om] = osTime.split(':').map(Number);
        const osStart = oh * 60 + om;
        const osDuration = o.estimatedDuration || 60;
        const osEnd = osStart + osDuration;

        // Check Overlap: (StartA < EndB) && (EndA > StartB)
        return (newStart < osEnd && newEnd > osStart);
      });

      if (conflictingOrder) {
        // Format conflicting time for display
        const conflictTime = conflictingOrder.scheduledDate!.split('T')[1].substring(0, 5);

        setAlertModal({
          isOpen: true,
          title: "⚠️ Conflito de Agendamento",
          message: `O horário selecionado (${tempTime}) entra em conflito com a OS #${conflictingOrder.id}, que se inicia às ${conflictTime}. \nPor favor, escolha outro horário.`,
          type: 'error'
        });
        return;
      }
    }

    // Business Hours Check
    if (showScheduling && tempTime && tempDate) {
      // 1. Calculate Day of Week and Config Key
      const [y, month, d] = tempDate.split('-').map(Number);
      const dateObj = new Date(y, month - 1, d);
      const dayIndex = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
      const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const dayKey = daysMap[dayIndex];
      const dayConfig = settings?.horario_funcionamento?.[dayKey];

      // 2. Check if Day is Active (Open)
      if (dayConfig && !dayConfig.ativo) {
        setAlertModal({
          isOpen: true,
          title: "Oficina Fechada",
          message: `A oficina não funciona neste dia (${daysMap[dayIndex].charAt(0).toUpperCase() + daysMap[dayIndex].slice(1)}). \nPor favor, selecione um dia útil.`,
          type: 'error'
        });
        return;
      }

      // 3. Check Time Limits (Opening and Closing)
      const [h, minute] = tempTime.split(':').map(Number);
      const startMins = h * 60 + minute; // Absolute minutes in day
      const duration = order.estimatedDuration || 60;
      const endMins = startMins + duration;

      // Get configured hours or default
      const configStart = dayConfig?.inicio || '08:00';
      const configEnd = dayConfig?.fim || '18:00';

      const [openH, openM] = configStart.split(':').map(Number);
      const [closeH, closeM] = configEnd.split(':').map(Number);
      const openMins = openH * 60 + openM;
      const closeMins = closeH * 60 + closeM;

      if (startMins < openMins) {
        setAlertModal({
          isOpen: true,
          title: "Fora do Horário",
          message: `O horário selecionado (${tempTime}) é anterior à abertura da oficina (${configStart}).`,
          type: 'error'
        });
        return;
      }

      if (endMins > closeMins) {
        // Calculate Overflow
        const remainingMins = endMins - closeMins;

        // Find Next Business Day
        const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        let nextDate = new Date(y, month - 1, d);
        let nextDayConfig = null;
        let daysAdded = 0;

        // Loop to find next active day (limit 7 days to avoid infinite loop)
        while (daysAdded < 7) {
          nextDate.setDate(nextDate.getDate() + 1);
          daysAdded++;
          const dayIdx = nextDate.getDay();
          const dayKey = daysMap[dayIdx];
          const config = settings?.horario_funcionamento?.[dayKey];
          if (config && config.ativo) {
            nextDayConfig = config;
            break;
          }
        }

        if (nextDayConfig) {
          const nextStartStr = nextDayConfig.inicio || '08:00';
          const [nsH, nsM] = nextStartStr.split(':').map(Number);
          const nextStartMins = nsH * 60 + nsM;
          const nextEndMins = nextStartMins + remainingMins;

          // Format Next End Time
          const neH = Math.floor(nextEndMins / 60);
          const neM = nextEndMins % 60;
          const nextEndStr = `${neH.toString().padStart(2, '0')}:${neM.toString().padStart(2, '0')}`;
          const nextDateStr = nextDate.toLocaleDateString('pt-BR');
          const isoNextDate = nextDate.toISOString().split('T')[0];

          // Check Availability for Next Day Segment
          let isNextSlotBusy = false;
          // Filter orders for next day & same mechanic
          const nextDayOrders = orders.filter(o =>
            o.mechanicId === tempMechanicId &&
            o.scheduledDate &&
            o.scheduledDate.startsWith(isoNextDate)
          );

          // Check for overlaps on next day
          // Range: [nextStartMins, nextEndMins]
          nextDayOrders.forEach(o => {
            const osTime = o.scheduledDate!.split('T')[1].substring(0, 5);
            const [oh, om] = osTime.split(':').map(Number);
            const osStart = oh * 60 + om;
            const osDuration = o.estimatedDuration || 60;
            const osEnd = osStart + osDuration;

            // Collision logic: (StartA < EndB) and (EndA > StartB)
            if (osStart < nextEndMins && osEnd > nextStartMins) {
              isNextSlotBusy = true;
            }
          });

          if (isNextSlotBusy) {
            setConfirmModal({
              isOpen: true,
              title: "⚠️ Conflito no Agendamento Dividido",
              message: `O serviço excede o expediente de hoje e a continuação automática cairia em um horário JÁ OCUPADO.\n\nContinuação: ${nextDateStr} das ${nextStartStr} às ${nextEndStr}.\n\nDeseja agendar mesmo assim (sobrepondo horários)?`,
              confirmLabel: "Sim, Agendar (Com Conflito)",
              onConfirm: () => {
                setConfirmModal(null);
                executeStageChange();
              }
            });
          } else {
            setConfirmModal({
              isOpen: true,
              title: "Agendamento Dividido",
              message: `O serviço excede o expediente (${configEnd}).\n\nEle será dividido automaticamente:\n• Hoje: até ${configEnd}\n• Continuação: ${nextDateStr} das ${nextStartStr} às ${nextEndStr}\n\nDeseja confirmar?`,
              confirmLabel: "Confirmar Divisão",
              onConfirm: () => {
                setConfirmModal(null);
                executeStageChange();
              }
            });
          }
          return;
        }

        // Fallback if no next business day found (rare)
        setConfirmModal({
          isOpen: true,
          title: "Horário Limite Excedido",
          message: `O serviço estimado (${duration}min) ultrapassa o horário de fechamento (${configEnd}).\n\nDeseja agendar mesmo assim?`,
          onConfirm: () => {
            setConfirmModal(null);
            executeStageChange();
          }
        });
        return;
      }
    }

    executeStageChange();
  };

  const parseDuration = (str?: string) => {
    if (!str) return 60;
    let minutes = 0;
    const hMatch = str.match(/(\d+)h/);
    if (hMatch) minutes += parseInt(hMatch[1]) * 60;
    const mMatch = str.match(/(\d+)min/);
    if (mMatch) minutes += parseInt(mMatch[1]);
    return minutes || 60;
  };

  const executeStageChange = () => {
    if (hasChanges) updateOrder(order.id, { diagnosis: localDiagnosis });

    const updateData: Partial<WorkshopOrder> = {};
    if (showScheduling) {
      updateData.mechanicId = tempMechanicId;
      // Create a Date object in local time (browser's timezone)
      const [year, month, day] = tempDate.split('-').map(Number);
      const [hour, minute] = tempTime.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hour, minute);

      updateData.scheduledDate = localDate.toISOString();

      // Calculate and save Estimated Duration from Gearbox if available
      if (gearbox?.assemblyTime) {
        updateData.estimatedDuration = parseDuration(gearbox.assemblyTime);
      } else {
        updateData.estimatedDuration = 60; // Default
      }

      const mechanicName = mechanics.find(m => m.id === tempMechanicId)?.name || 'N/A';
      const [y, m, d] = tempDate.split('-');
      const formattedDate = `${d}/${m}/${y}`;

      if (isRescheduling) {
        addHistoryLog(order.id, 'Agendamento de Montagem', `Reagendado para ${formattedDate} às ${tempTime} com ${mechanicName}`);
      } else {
        addHistoryLog(order.id, 'Agendamento de Montagem', `Agendado para ${formattedDate} às ${tempTime} para o mecânico ${mechanicName}`);
      }
    }

    // Financial Integration: Create Transaction on Finish
    if (targetStatus === OSStatus.FINISHED) {
      // Check for existing transaction to avoid duplicates
      const existingTransaction = context.transactions.find(t => t.orderId === order.id);

      if (!existingTransaction) {
        const transactionValue = totalValue; // Uses the calculated value from render scope

        // Wrap in async IIFE or just call without await but handle promise catch properly
        // Better: Make executeStageChange async? It is not async currently.
        // Let's use then/catch to handle the promise side-effect without blocking UI excessively, 
        // but ideally we should block closure.

        context.addTransaction({
          id: crypto.randomUUID(),
          description: `Receita OS #${order.id} - ${client?.name || 'Cliente'}`,
          category: 'Serviços',
          amount: transactionValue,
          type: 'IN',
          status: 'PAID',
          date: new Date().toISOString().split('T')[0],
          orderId: order.id,
          paymentMethod: selectedPaymentMethod || undefined
        }).then(() => {
          addHistoryLog(order.id, 'FINANCEIRO', `Gerou receita de R$ ${transactionValue.toFixed(2)}`);
        }).catch(err => {
          console.error("Erro ao gerar financeiro:", err);
          // Fallback: Notify user that financial record failed (likely migration issue)
          alert("ATENÇÃO: A receita não foi gerada automaticamente.\n\nMotivo provável: Banco de dados desatualizado.\nPor favor, execute o script de migração enviado.");
        });
      }
    }

    if (targetStatus) updateOrderStatus(order.id, targetStatus);
    if (Object.keys(updateData).length > 0) updateOrder(order.id, updateData);
    setIsRescheduling(false);
    onClose();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;
    if (newItemPrice <= 0) {
      setShowPriceError(true);
      priceInputRef.current?.focus();
      return;
    }

    try {
      // Check if item exists (Smart Add)
      const existingItem = order.items?.find(i => i.description.toLowerCase() === newItemDesc.toLowerCase() && i.type === newItemType);

      if (existingItem) {
        // Update Quantity
        const newQuantity = existingItem.quantity + newItemQty;
        await updateOrderItemService(existingItem.id, { quantity: newQuantity });

        // Update Local State
        const updatedItems = order.items.map(i => i.id === existingItem.id ? { ...i, quantity: newQuantity } : i);
        updateOrder(order.id, { items: updatedItems });

        addHistoryLog(order.id, 'Atualização de Item', `Qtd atualizada: ${existingItem.description} (${existingItem.quantity} -> ${newQuantity})`);
      } else {
        // Create New Item
        const itemPayload: OrderItem = {
          id: '',
          type: newItemType,
          description: newItemDesc,
          quantity: newItemQty,
          price: newItemPrice,
          waitingForParts: isWaitingParts,
          expectedArrival: isWaitingParts ? new Date(Date.now() + daysToArrive * 24 * 60 * 60 * 1000).toISOString() : undefined
        };

        const savedItem = await addOrderItemService(order.id, itemPayload);
        const newItems = [...(order.items || []), savedItem];
        updateOrder(order.id, { items: newItems });

        addHistoryLog(order.id, 'Adição de Item', `${newItemType === 'PART' ? 'Peça' : 'Serviço'}: ${newItemDesc}`);
      }

      // Reset fields
      setNewItemDesc('');
      setNewItemQty(1);
      setNewItemPrice(0);
      setIsWaitingParts(false);
      setDaysToArrive(2);
      setShowPriceError(false);
    } catch (error) {
      console.error("Failed to add/update item", error);
      alert("Erro ao salvar item no banco de dados.");
    }
  };

  const handleFinishAdding = async (e: React.MouseEvent) => {
    // If there is pending data, try to add it first
    if (newItemDesc.trim()) {
      // Validate before trying to close
      if (newItemPrice <= 0) {
        setShowPriceError(true);
        priceInputRef.current?.focus();
        return; // Stop here, do not close
      }
      // Call adding logic
      await handleAddItem(e as any);
    }
    // Close only if successful (handleAddItem resets fields on success) OR if it was empty
    // If it failed/returned early, newItemDesc would still be full? 
    // Actually handleAddItem is async, so we await it. 
    // If handleAddItem returned early, newItemDesc is still there.
    // If handleAddItem succeeded, newItemDesc is ''.

    // We check state via ref or just check validation again?
    // Actually simpler: checked validation above. If validation passed, handleAddItem RAN.
    // handleAddItem clears newItemDesc on success.
    // So distinct check:

    /* 
       Wait, handleAddItem returns logic void. We can't know easily if it succeeded without checking items or state.
       But since `newItemDesc` state is updated asynchronously, we can't check it immediately after await? 
       React state updates batch. 
       Let's assume success if no error thrown. 
       The safest way is to check `newItemPrice` again. 
    */

    setIsAddingItem(false);
  };

  const removeItem = async (itemId: string) => {
    try {
      // Get item details before deletion for logging
      const itemToDelete = order.items.find(i => i.id === itemId);
      const itemType = itemToDelete?.type === 'PART' ? 'Peça' : 'Serviço';
      const itemDesc = itemToDelete?.description || 'Item';

      await deleteOrderItemService(itemId);
      const newItems = order.items.filter(i => i.id !== itemId);
      updateOrder(order.id, { items: newItems });

      // Log history with friendly message
      addHistoryLog(order.id, 'Remoção de Item', `${itemType} removido: ${itemDesc} (Qtd: ${itemToDelete?.quantity || 1} - R$ ${itemToDelete?.price?.toFixed(2) || '0.00'})`);
    } catch (error) {
      console.error("Failed to delete item", error);
      alert("Erro ao excluir item.");
    }
  };

  // Checklist handlers
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;

    const newItem: ChecklistItem = {
      id: `cl-${Date.now()}`,
      label: newChecklistItem,
      checked: false
    };

    updateOrder(order.id, { checklist: [...(order.checklist || []), newItem] });
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (itemId: string) => {
    const newChecklist = (order.checklist || []).map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    updateOrder(order.id, { checklist: newChecklist });
  };

  const removeChecklistItem = (itemId: string) => {
    const newChecklist = (order.checklist || []).filter(item => item.id !== itemId);
    updateOrder(order.id, { checklist: newChecklist });
  };

  const saveBudget = () => {
    updateOrder(order.id, { items: order.items });
    addHistoryLog(order.id, 'Orçamento Salvo', `Total de ${order.items.length} itens preservados.`);
    setHasChanges(false);
    alert('Orçamento salvo com sucesso!');
  };

  const handlePrint = () => {
    if (!order.items || order.items.length === 0) {
      setAlertModal({
        isOpen: true,
        title: "Orçamento sem ítem",
        message: "Não é possível imprimir um orçamento vazio.",
        type: 'warning'
      });
      return;
    }

    addHistoryLog(order.id, 'IMPRESSÃO', 'Imprimiu Orçamento');

    // Iframe Isolation Print Strategy
    const content = document.getElementById('whatsapp-pdf-content');
    if (content) {
      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write('<html><head><title>Imprimir Orçamento</title>');

        // Copy all styles from main page to preserve Tailwind/Fonts
        const styles = document.head.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(s => {
          doc.head.appendChild(s.cloneNode(true));
        });

        // Add specific print override to ensure visibility within iframe
        doc.write(`
          <style>
            @media print {
              @page { margin: 15mm 10mm; size: auto; }
              body { margin: 0; padding: 0; background: white; }
              #whatsapp-pdf-content { 
                visibility: visible !important; 
                box-shadow: none !important;
                margin: 0 !important;
                width: 100% !important;
              }
            }
          </style>
        `);

        doc.write('</head><body style="background:white;">');
        doc.write(content.innerHTML); // Layout content
        doc.write('</body></html>');
        doc.close();

        // Print after styles load
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          // Cleanup iframe after print 
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }, 500);
      }
    }
  };

  const handlePrintAuthTerm = () => {
    if (!client || !vehicle) return;

    addHistoryLog(order.id, 'IMPRESSÃO', 'Imprimiu Termo de Autorização');

    // Default template if none configured
    const defaultTemplate = "Eu, {CLIENTE}, proprietário(a) do veículo {MARCA} {VEICULO}, placa {PLACA}, autorizo a oficina {OFICINA} a realizar a abertura e desmontagem do câmbio para fins de diagnóstico e elaboração de orçamento.\n\nDeclaro estar ciente de que, após a desmontagem, caso o serviço não seja aprovado, será cobrada uma taxa de montagem ou o veículo será devolvido com o câmbio desmontado, conforme previamente acordado.\n\n{DATA}";

    let template = settings?.authTermTemplate || defaultTemplate;

    // Replace variables
    const vars: Record<string, string> = {
      '{CLIENTE}': client.name,
      '{MARCA}': vehicle.brand,
      '{VEICULO}': `${vehicle.model} (${vehicle.year || ''})`,
      '{PLACA}': vehicle.plate,
      '{DATA}': new Date().toLocaleDateString('pt-BR'),
      '{OFICINA}': settings?.nome_oficina || 'Oficina Master Pro'
    };

    Object.keys(vars).forEach(key => {
      // Use split/join or replaceAll to avoid Regex special character issues with curly braces
      template = template.split(key).join(vars[key]);
    });

    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write('<html><head><title>Imprimir Autorização</title>');
      // Inline styles for the term matching Budget Layout
      doc.write(`
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          /* Reduced margins to maximize space */
          @page { margin: 5mm; }
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 10mm; 
            color: #1e293b; 
            line-height: 1.5;
            min-height: 98vh; /* Force full height */
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
          }
          
          /* Utility-like classes to mimic Tailwind */
          .box { border: 1px solid #94a3b8; border-radius: 12px; padding: 25px; margin-bottom: 15px; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .text-sm { font-size: 14px; }
          .text-xs { font-size: 12px; }
          .uppercase { text-transform: uppercase; }
          .text-slate-500 { color: #64748b; }
          .mb-1 { margin-bottom: 4px; }
          
          /* Specifics */
          .logo-container { width: 80px; height: 80px; margin-right: 20px; display: flex; align-items: center; justify-content: center; }
          .logo { max-width: 100%; max-height: 100%; object-fit: contain; }
          
          .company-name { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 4px; line-height: 1.2; }
          
          .term-title { text-align: center; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 1px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; }
          .term-content { font-size: 14px; text-align: justify; line-height: 1.8; white-space: pre-wrap; }
          
          .signatures { margin-top: auto; display: flex; gap: 40px; width: 100%; }
          .sig-line { flex: 1; border-top: 1px solid #334155; padding-top: 8px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        </style>
      `);

      doc.write('</head><body>');

      // 1. Header Box (Company Info Only)
      doc.write('<div class="box flex items-center justify-between">');
      // Logo
      doc.write('<div class="logo-container">');
      if (settings?.logo_url) {
        doc.write(`<img src="${settings.logo_url}" class="logo" />`);
      } else {
        doc.write('<span style="color:#cbd5e1; font-size: 10px;">SEM LOGO</span>');
      }
      doc.write('</div>');

      // Company Info
      doc.write('<div class="text-right">');
      doc.write(`<div class="company-name">${settings?.nome_oficina || 'OFICINA MECÂNICA'}</div>`);
      doc.write('<div class="text-xs text-slate-500">');
      doc.write(`<p class="mb-1">${settings?.endereco || ''}${settings?.numero ? ', ' + settings.numero : ''}</p>`);
      doc.write(`<p class="mb-1">${settings?.cidade || ''} - ${settings?.estado || ''}</p>`);
      doc.write(`<p class="mb-1">Tel: ${settings?.telefone || ''} | Email: ${settings?.email || ''}</p>`);
      if (settings?.cnpj) doc.write(`<p class="font-bold">CNPJ: ${settings.cnpj}</p>`);
      doc.write('</div>');
      doc.write('</div>');
      doc.write('</div>');

      // 2. Term Body Box (Contains Title and Text only)
      doc.write('<div class="box">');
      doc.write('<h2 class="term-title">Termo de Autorização de Serviço</h2>');
      doc.write(`<div class="term-content">${template}</div>`);
      doc.write('</div>');

      // 3. Signatures (Outside the box now)
      doc.write('<div class="signatures">');
      doc.write(`<div class="sig-line">${client.name}<br><span style="font-weight:400; color:#64748b">Cliente / Responsável</span></div>`);
      doc.write(`<div class="sig-line">${settings?.nome_oficina || 'Oficina'}<br><span style="font-weight:400; color:#64748b">Responsável Técnico</span></div>`);
      doc.write('</div>');

      doc.write('</body></html>');
      doc.close();

      // Print
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 2000);
      }, 500);
    }
  };



  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { data: uploadedDoc, error } = await uploadDocService(order.id, selectedFile, fileName);

      if (error) {
        alert(error); // Show exact error to user
        return;
      }

      if (uploadedDoc) {
        const newDocs = [...documents, uploadedDoc];
        setDocuments(newDocs);
        updateOrder(order.id, { documents: newDocs });
        addHistoryLog(order.id, 'DOCUMENTO', `Enviou documento "${fileName || selectedFile.name}"`);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar arquivo.');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setFileName('');
      setFilePreview(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name.split('.')[0]); // Default name

      // Preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleAddObservation = () => {
    if (!newObservation.trim()) return;

    const timestamp = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const formattedNote = `[${timestamp}] ${newObservation}\n`;
    const updatedDiagnosis = (localDiagnosis ? localDiagnosis + '\n' : '') + formattedNote;

    setLocalDiagnosis(updatedDiagnosis);
    updateOrder(order.id, { diagnosis: updatedDiagnosis });

    // Log to history with the actual text
    addHistoryLog(order.id, 'Observação Adicionada', `"${newObservation}"`);

    setNewObservation('');
  };



  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; background: white !important; }
          #printable-budget, #printable-budget * { visibility: visible !important; }
          #printable-budget {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: white !important;
            color: black !important;
            display: block !important;
            z-index: 9999 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { size: auto; margin: 0; }
        }
      `}</style>



      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 no-print" onClick={onClose}>
        <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
          <header className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest shadow-sm">OS: #{order.id}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest shadow-sm ${STATUS_CONFIG[order.status].color}`}>{STATUS_CONFIG[order.status].label}</span>
                {order.category === 'RESTORATION' && (
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-widest shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    PROJETO DE RESTAURAÇÃO
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{vehicle?.brand} {vehicle?.model} <span className="text-slate-300 font-mono text-sm ml-1">[{vehicle?.plate}]</span></h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{client?.name} • {client?.phone}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X className="w-5 h-5" /></button>
          </header>

          {!showScheduling && (
            <nav className="flex border-b border-slate-100 px-6 bg-slate-50/30 shrink-0">
              <button onClick={() => setActiveTab('details')} className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><Activity className="w-3.5 h-3.5" /> DIAGNÓSTICO</button>
              <button onClick={() => setActiveTab('items')} className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${activeTab === 'items' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><Package className="w-3.5 h-3.5" /> ORÇAMENTO</button>
              <button onClick={() => setActiveTab('documents')} className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><FileText className="w-3.5 h-3.5" /> DOCUMENTOS</button>
              <button onClick={() => setActiveTab('history')} className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><History className="w-3.5 h-3.5" /> HISTÓRICO</button>
            </nav>
          )}

          <main className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            {showScheduling ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-center gap-4 shadow-inner">
                  <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg"><Calendar className="w-6 h-6 text-white" /></div>
                  <div className="flex-1">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Agendar Montagem</h3>
                    <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-tight">Defina o técnico e escolha um slot de horário livre.</p>
                  </div>
                  {gearbox?.assemblyTime && (
                    <div className="bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-sm text-center min-w-[100px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tempo Montagem</p>
                      <p className="text-sm font-black text-indigo-600">{gearbox.assemblyTime}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mecânico</label>
                    <select
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={tempMechanicId}
                      onChange={(e) => { setTempMechanicId(e.target.value); setTempTime(''); }}
                    >
                      <option value="">Selecione o técnico...</option>
                      {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Planejada</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={tempDate}
                      onChange={(e) => { setTempDate(e.target.value); setTempTime(''); }}
                    />
                  </div>
                </div>

                {tempMechanicId && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Disponibilidade da Grade</label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-slate-100 border border-slate-200"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Livre</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-red-100 border border-red-200"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Ocupado</span></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map(slot => {
                        const status = slotStatus[slot] || { state: 'free' };
                        const isBusy = status.state === 'busy';
                        const isPartial = status.state === 'partial_start';
                        const isSelected = tempTime === slot || (isPartial && tempTime === status.startAt);

                        return (
                          <button
                            key={slot}
                            disabled={isBusy}
                            type="button"
                            onClick={() => setTempTime(isPartial && status.startAt ? status.startAt : slot)}
                            className={`
                            py-3 rounded-xl border text-[10px] font-black transition-all flex items-center justify-center gap-1.5 relative overflow-hidden
                            ${isBusy ? 'bg-red-50 border-red-100 text-red-300 cursor-not-allowed' :
                                isSelected ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-100' :
                                  'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'}
                          `}
                            style={isPartial && !isSelected ? {
                              background: 'linear-gradient(90deg, #fee2e2 50%, #ffffff 50%)',
                              borderColor: '#e2e8f0'
                            } : {}}
                          >
                            <Clock className={`w-3 h-3 ${isSelected ? 'text-indigo-200' : isPartial && !isSelected ? 'text-slate-400 mix-blend-multiply' : 'text-slate-400'}`} />
                            {isPartial && !isSelected ?
                              <span className="z-10 flex gap-1"><span className="text-red-300 line-through decoration-red-300">{slot}</span> <span className="text-emerald-600">30min</span></span>
                              :
                              slot
                            }
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowScheduling(false)} className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase border border-slate-100 rounded-xl">Voltar</button>
                  <button
                    type="button"
                    onClick={finalizeStageChange}
                    disabled={!tempMechanicId || !tempTime}
                    className="flex-[2] py-3 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    Confirmar Agendamento
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'details' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4 items-start">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl h-full shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Relato Original</p>
                        <p className="text-xs text-slate-700 italic leading-relaxed font-medium">"{order.reportedFault || 'Nenhum relato.'}"</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5">Status de Prioridade</p>
                          <div className={`px-4 py-2.5 border rounded-xl flex items-center justify-center gap-2 ${PRIORITY_CONFIG[order.priority].bg} ${PRIORITY_CONFIG[order.priority].border} shadow-sm`}>
                            <div className={`w-2 h-2 rounded-full ${order.priority === Priority.HIGH ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${PRIORITY_CONFIG[order.priority].color}`}>{PRIORITY_CONFIG[order.priority].label}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5">Tipo de Atendimento</p>
                          {client?.type === 'COMPANY' ? (
                            <div className="px-4 py-2.5 border border-purple-200 bg-purple-50 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                              <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-purple-700">Frota / Empresa</span>
                            </div>
                          ) : (
                            <div className="px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Serviço Particular</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Agendamento Info - Visible only if SCHEDULED or EXECUTION */}
                    {(order.status === OSStatus.SCHEDULED || order.status === OSStatus.EXECUTION) && order.scheduledDate && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 mt-4">
                        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md text-white">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-tight">Agendamento Atual</h3>
                          <p className="text-xs font-bold text-indigo-700 mt-0.5">
                            {new Date(order.scheduledDate).toLocaleDateString()} às {new Date(order.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">
                            Mecânico: {mechanics.find(m => m.id === order.mechanicId)?.name || 'N/A'}
                          </p>
                        </div>

                        {order.status === OSStatus.SCHEDULED && (
                          <button
                            onClick={() => {
                              setIsRescheduling(true);
                              setTempDate(order.scheduledDate!.split('T')[0]);
                              setTempMechanicId(order.mechanicId || '');
                              const timePart = new Date(order.scheduledDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              setTempTime(timePart);

                              setShowScheduling(true);
                            }}
                            className="px-3 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                          >
                            Reagendar
                          </button>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico e Observações</label>
                      </div>

                      {/* History Log View */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[120px] max-h-[300px] overflow-y-auto shadow-inner">
                        {localDiagnosis ? (
                          <div className="whitespace-pre-wrap text-xs text-slate-700 font-medium leading-relaxed">
                            {localDiagnosis}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic text-center py-8">Nenhuma observação registrada.</p>
                        )}
                      </div>

                      {/* Add New Observation Input */}
                      <div className="flex gap-2 items-start">
                        <textarea
                          placeholder="Digite uma nova observação para adicionar..."
                          className="flex-1 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-900 font-medium shadow-sm transition-all h-[50px] min-h-[50px]"
                          value={newObservation}
                          onChange={(e) => setNewObservation(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddObservation();
                            }
                          }}
                          disabled={isFinished}
                        />
                        <button
                          onClick={handleAddObservation}
                          disabled={!newObservation.trim() || isFinished}
                          className="bg-indigo-600 text-white px-4 h-[50px] rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Documentação</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Fotos, Laudos e PDFs</p>
                      </div>
                    </div>

                    <form onSubmit={handleUpload} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50/80 transition-all">
                      {!selectedFile ? (
                        <>
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Upload className="w-6 h-6" />
                          </div>
                          <label className={`block ${isFinished ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Clique para enviar</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide"> ou arraste o arquivo</span>
                            <input type="file" className="hidden" onChange={handleFileSelect} accept="image/png,image/jpeg,application/pdf" disabled={isFinished} />
                          </label>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">JPG, PNG ou PDF (Máx. 5MB)</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          {filePreview ? (
                            <img src={filePreview} alt="Preview" className="h-32 w-auto object-contain rounded-lg shadow-sm border border-slate-200" />
                          ) : (
                            <div className="h-32 w-32 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                              <FileText className="w-12 h-12" />
                            </div>
                          )}
                          <div className="w-full max-w-xs">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left block mb-1">Nome do Arquivo</label>
                            <input
                              type="text"
                              value={fileName}
                              onChange={e => setFileName(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none uppercase"
                              autoFocus
                            />
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setSelectedFile(null)} className="px-4 py-2 text-slate-400 font-black text-[10px] uppercase hover:text-slate-600">Cancelar</button>
                            <button type="submit" disabled={isUploading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50">
                              {isUploading ? 'Enviando...' : 'Confirmar Upload'}
                            </button>
                          </div>
                        </div>
                      )}
                    </form>

                    <div className="space-y-2">
                      {documents.length > 0 ? documents.map(doc => (
                        <div key={doc.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all hover:shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                              {doc.type.includes('IMAGE') || doc.type === 'JPG' || doc.type === 'PNG' ? (
                                <ImageIcon className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{doc.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(doc.createdAt).toLocaleDateString()} • {doc.type}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Baixar / Abrir Original"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDocToDelete(doc)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir Documento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-[10px] font-black text-slate-300 uppercase">Nenhum documento anexado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'items' && (
                  <div id="budget-pdf-content" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Orçamento Detalhado</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Peças e Mão de Obra</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex gap-2">
                          <button onClick={() => {
                            if (!order.items || order.items.length === 0) {
                              setAlertModal({
                                isOpen: true,
                                title: "Orçamento Vazio",
                                message: "Não é possível enviar um orçamento vazio.\nAdicione itens antes de prosseguir.",
                                type: 'error'
                              });
                              return;
                            }
                            const phone = client?.phone?.replace(/\D/g, '') || '';
                            if (!phone) {
                              alert('Cliente sem telefone cadastrado.');
                              return;
                            }
                            setWhatsappModal({ isOpen: true, step: 'confirm' });
                          }}
                            type="button"
                            disabled={order.status !== OSStatus.BUDGET && order.status !== OSStatus.RECEPTION}
                            style={{ display: (order.status === OSStatus.BUDGET || order.status === OSStatus.RECEPTION) ? 'flex' : 'none' }}
                            className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-[#128C7E] transition-all flex items-center gap-1.5"
                            title="Enviar no WhatsApp"
                          >
                            <div className="w-3 h-3 fill-current"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg></div>
                            WhatsApp
                          </button>
                          <button onClick={handlePrint} type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-all border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg flex items-center gap-2" title="Imprimir Orçamento">
                            <Printer className="w-4 h-4" />
                          </button>
                          {(order.status === OSStatus.BUDGET || order.status === OSStatus.APPROVAL) && (
                            <button onClick={handlePrintAuthTerm} type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-all border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg flex items-center gap-2" title="Imprimir Termo de Autorização">
                              <FileSignature className="w-4 h-4" />
                            </button>
                          )}
                          {!isAddingItem && !isFinished && (order.status === OSStatus.BUDGET || order.status === OSStatus.RECEPTION) && <button type="button" onClick={() => setIsAddingItem(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5"><Plus className="w-3 h-3" /> Novo Item</button>}
                        </div>
                      </div>
                    </div>
                    {isAddingItem && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-inner">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Novo Item</span>
                          <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                              <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-900 outline-none" value={newItemType} onChange={(e) => { setNewItemType(e.target.value as 'PART' | 'SERVICE'); setNewItemDesc(''); setNewItemPrice(0); }}>
                                <option value="PART">Peça / Produto</option>
                                <option value="SERVICE">Serviço / Mão de Obra</option>
                              </select>
                            </div>
                            <div className="col-span-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Catálogo</label>
                              <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-900 outline-none" onChange={(e) => {
                                if (newItemType === 'PART') {
                                  const item = inventory.find(i => i.id === e.target.value);
                                  if (item) { setNewItemDesc(item.name); setNewItemPrice(item.salePrice); }
                                } else {
                                  const svc = services.find(s => s.id === e.target.value);
                                  if (svc) { setNewItemDesc(svc.name); setNewItemPrice(svc.price); }
                                }
                              }}>
                                <option value="">Selecionar...</option>
                                {newItemType === 'PART' ? inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>) : services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label><input required type="text" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-900 outline-none uppercase" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd</label><input type="number" min="1" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-900 outline-none" value={newItemQty} onChange={(e) => setNewItemQty(Number(e.target.value))} /></div>
                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço R$</label>
                              <input
                                ref={priceInputRef}
                                type="number"
                                step="0.01"
                                className={`w-full p-2 bg-white border rounded-lg text-[10px] font-bold text-slate-900 outline-none transition-colors ${showPriceError ? 'border-red-300 focus:border-red-400 bg-red-50' : 'border-slate-200'}`}
                                value={newItemPrice}
                                onChange={(e) => {
                                  setNewItemPrice(Number(e.target.value));
                                  if (Number(e.target.value) > 0) setShowPriceError(false);
                                }}
                              />
                              {showPriceError && <p className="text-[8px] font-bold text-red-500 mt-1 ml-1 animate-in slide-in-from-top-1">Valor obrigatório</p>}
                            </div>
                          </div>

                          {/* Waiting Parts Toggle */}
                          {newItemType === 'PART' && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Aguardar Peça?</label>
                                <div onClick={() => setIsWaitingParts(!isWaitingParts)} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isWaitingParts ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                  <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isWaitingParts ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                              </div>

                              {isWaitingParts && (
                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                  <label className="text-[8px] font-black text-amber-600 uppercase tracking-widest ml-1">Dias para chegar</label>
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="number"
                                      min="1"
                                      className="w-16 p-1.5 bg-white border border-amber-200 rounded-lg text-[10px] font-bold text-amber-900 outline-none text-center"
                                      value={daysToArrive}
                                      onChange={(e) => setDaysToArrive(Number(e.target.value))}
                                    />
                                    <span className="text-[9px] font-bold text-amber-700">
                                      Chegada: {new Date(Date.now() + daysToArrive * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 mt-2">
                            <button type="button" onClick={handleFinishAdding} className="flex-1 py-2 text-slate-400 text-[9px] font-black uppercase border border-slate-200 rounded-lg hover:bg-slate-50">Concluir Adição</button>
                            <button type="submit" className="flex-[2] py-2 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5" /> Adicionar</button>
                          </div>
                        </form>
                      </div>
                    )}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <tr><th className="px-5 py-4">Descrição</th><th className="px-5 py-4 text-center">Tipo</th><th className="px-5 py-4 text-center">Qtd</th><th className="px-5 py-4 text-right">Total</th><th className="px-5 py-4 w-10"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {order.items.length > 0 ? order.items.map(i => (
                            <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-5 py-4 text-xs font-bold text-slate-700 uppercase">{i.description}</td>
                              <td className="px-5 py-4 text-center"><span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${i.type === 'PART' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>{i.type === 'PART' ? 'Peça' : 'M.O'}</span></td>
                              <td className="px-5 py-4 text-center text-xs font-bold text-slate-500">{i.quantity}</td>
                              <td className="px-5 py-4 text-right font-mono text-xs text-slate-900 font-black tracking-tighter">R$ {(i.price * i.quantity).toLocaleString()}</td>
                              <td className="px-5 py-4 text-right"><button onClick={() => removeItem(i.id)} disabled={!(order.status === OSStatus.BUDGET || order.status === OSStatus.RECEPTION)} className={`text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ${!(order.status === OSStatus.BUDGET || order.status === OSStatus.RECEPTION) ? 'hidden' : ''}`}><Trash2 className="w-3.5 h-3.5" /></button></td>
                            </tr>
                          )) : <tr><td colSpan={5} className="px-5 py-12 text-center text-[10px] text-slate-300 font-black uppercase">Nenhum item adicionado.</td></tr>}
                        </tbody>
                        {order.items.length > 0 && <tfoot className="bg-slate-50/50"><tr><td colSpan={3} className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase">Total:</td><td className="px-5 py-3 text-right font-mono text-sm text-indigo-600 font-black">R$ {totalValue.toLocaleString()}</td><td></td></tr></tfoot>}
                      </table>
                    </div>
                    {/* Budget Controls */}
                    <div className="mt-4 flex flex-col md:flex-row gap-4 animate-in slide-in-from-bottom-2 duration-300">
                      {/* Notes Input */}
                      <div className="flex-[2] bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col group focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações do Orçamento (Impresso)</label>
                        </div>
                        <textarea
                          value={localNotes}
                          onChange={(e) => { setLocalNotes(e.target.value); setHasChanges(true); }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-medium outline-none resize-none focus:border-indigo-300 transition-all placeholder:text-slate-300"
                          placeholder="Ex: Garantia de 90 dias. Validade da proposta de 15 dias."
                          disabled={!(order.status === OSStatus.BUDGET || order.status === OSStatus.RECEPTION) || isFinished}
                        />
                      </div>

                      {/* Financials Input */}
                      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Desconto</label>
                          <div className="flex gap-2 mt-1">
                            <select
                              value={discountType}
                              onChange={(e) => { setDiscountType(e.target.value as 'value' | 'percent'); setHasChanges(true); }}
                              className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 text-center uppercase"
                              disabled={!(order.status === OSStatus.BUDGET || order.status === OSStatus.RECEPTION) || isFinished}
                            >
                              <option value="value">R$</option>
                              <option value="percent">%</option>
                            </select>
                            <input
                              type="number"
                              value={discount === 0 ? '' : discount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDiscount(val === '' ? 0 : Number(val));
                                setHasChanges(true);
                              }}
                              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 text-right"
                              placeholder="0,00"
                              disabled={!(order.status === OSStatus.BUDGET || order.status === OSStatus.RECEPTION) || isFinished}
                            />
                          </div>
                        </div>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Final</span>
                          <span className="text-lg font-black text-indigo-700">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    {orderHistory.length > 0 ? orderHistory.map(log => {
                      // Formatting Logic
                      let label = log.action;
                      let colorClass = 'bg-indigo-500';
                      let bgClass = 'bg-slate-50/50';

                      if (log.action === 'IMPRESSÃO') { label = 'Impressão do Orçamento'; colorClass = 'bg-slate-500'; }
                      else if (log.action === 'WHATSAPP') { label = 'Envio via WhatsApp'; colorClass = 'bg-[#25D366]'; }
                      else if (log.action === 'ESTORNO') { label = 'Estorno de Etapa'; colorClass = 'bg-amber-500'; bgClass = 'bg-amber-50/30'; }
                      else if (log.action === 'Mudança de Status') { label = 'Avanço de Etapa'; colorClass = 'bg-indigo-600'; }
                      else if (log.action === 'Alteração de dados') { label = 'Atualização de Dados'; colorClass = 'bg-slate-400'; }
                      else if (log.action === 'Agendamento de Montagem') { label = 'Agendamento Confirmado'; colorClass = 'bg-purple-600'; }
                      else if (log.action === 'Criação') { label = 'Abertura da OS'; colorClass = 'bg-emerald-500'; }

                      // Translate Diff Content
                      let diffText = log.diff || '';
                      diffText = diffText
                        // Field names
                        .replace(/estimatedDuration/g, 'Tempo Estimado')
                        .replace(/mechanicId/g, 'Mecânico Responsável')
                        .replace(/scheduledDate/g, 'Data Agendada')
                        .replace(/scheduledTime/g, 'Horário Agendado')
                        .replace(/diagnosis/g, 'Diagnóstico')
                        .replace(/discountType/g, 'Tipo de Desconto')
                        .replace(/discount/g, 'Desconto')
                        .replace(/notes/g, 'Observações')
                        .replace(/priority/g, 'Prioridade')
                        .replace(/status/g, 'Status')
                        .replace(/gearboxId/g, 'Câmbio')
                        .replace(/vehicleId/g, 'Veículo')
                        .replace(/clientId/g, 'Cliente')
                        // Status values
                        .replace(/BUDGET/g, 'Orçamento')
                        .replace(/APPROVAL/g, 'Aguardando Aprovação')
                        .replace(/SCHEDULED/g, 'Agendado Montagem')
                        .replace(/EXECUTION/g, 'Em Execução')
                        .replace(/FINISHED/g, 'Finalizado')
                        .replace(/RECEPTION/g, 'Recepção')
                        // Priority values
                        .replace(/URGENT/g, 'Urgente')
                        .replace(/HIGH/g, 'Alta')
                        .replace(/NORMAL/g, 'Normal')
                        .replace(/LOW/g, 'Baixa')
                        // Other
                        .replace(/null/g, '(vazio)')
                        .replace(/undefined/g, '(não definido)')
                        .replace(/->/g, ' → ')
                        .replace(/Alterou /g, 'Alterou ')
                        .replace(/Alterado para /g, 'Alterado para ');

                      return (
                        <div key={log.id} className={`p-4 ${bgClass} border border-slate-100 rounded-2xl relative overflow-hidden shadow-sm transition-all hover:shadow-md`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`}></div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass.replace('bg-', 'text-')}`}>
                              {label}
                              {log.count > 1 && <span className="ml-2 bg-slate-100 text-slate-600 text-[8px] px-1.5 py-0.5 rounded-full border border-slate-200">{log.count}x</span>}
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 font-mono tracking-tight font-mono">{new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {diffText && <p className="text-[10px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pl-2 border-l border-slate-200">{diffText}</p>}
                        </div>
                      );
                    }) : (
                      <div className="text-center py-12 flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-slate-200" />
                        <p className="text-[10px] font-black text-slate-300 uppercase">Sem histórico registrado.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main >

          {/* Document Deletion Confirmation Modal */}
          {docToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDocToDelete(null)}>
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-1">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">Excluir Documento?</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Tem certeza que deseja excluir permanentemente o arquivo <span className="text-slate-900 font-black">"{docToDelete.name}"</span>?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <button
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                      onClick={() => setDocToDelete(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-red-100"
                      onClick={handleDeleteDocument}
                    >
                      Sim, Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Selection Modal */}
          {paymentModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-1">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">Finalizar Serviço</h3>
                    <p className="text-sm text-slate-500 font-medium mb-4">
                      Selecione a forma de pagamento para registrar a receita de <span className="text-emerald-600 font-black">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>.
                    </p>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {paymentMethods?.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <button
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                      onClick={() => setPaymentModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (!selectedPaymentMethod) return;
                        setPaymentModalOpen(false);
                        finalizeStageChange();
                      }}
                      disabled={!selectedPaymentMethod}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <footer className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/30 shrink-0 no-print">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => {
                const warnings = [];
                if (order.items?.length > 0) warnings.push(`• Possui ${order.items.length} itens no orçamento.`);
                if (order.status === OSStatus.SCHEDULED || order.status === OSStatus.EXECUTION) warnings.push(`• Possui agendamento ativo.`);
                if (orderHistory.some(h => h.action === 'APPROVAL')) warnings.push(`• Cliente já havia aprovado.`);
                if (order.status === OSStatus.FINISHED) warnings.push(`• A ordem já foi finalizada.`);

                setShowDeleteModal({
                  isOpen: true,
                  title: "Excluir Ordem de Serviço?",
                  message: "Esta ação é irreversível e excluirá todos os dados atrelados.",
                  warnings
                });
              }} disabled={isFinished} className={`p-2 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200 hover:bg-slate-50 rounded-lg ${isFinished ? 'opacity-30 cursor-not-allowed' : ''}`} title="Excluir OS"><Trash2 className="w-4 h-4" /></button>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <button type="button" onClick={handleRevert} className="p-2 text-slate-400 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100 hover:bg-amber-50 rounded-lg" title="Estornar / Voltar"><Undo2 className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && !showScheduling && !isFinished && (
                <button type="button" onClick={() => { updateOrder(order.id, { diagnosis: localDiagnosis, discount, discountType, notes: localNotes }); setHasChanges(false); }} className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-all flex items-center gap-1.5 active:scale-95"><Save className="w-3.5 h-3.5" /> Salvar</button>
              )}
              {targetStatus && !showScheduling && !isFinished && (
                <button type="button" onClick={handleAdvance} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all flex items-center gap-1.5 active:scale-95">
                  {order.status === OSStatus.BUDGET ? 'ENVIAR PARA APROVAÇÃO' :
                    order.status === OSStatus.APPROVAL ? 'AGENDAR MONTAGEM' :
                      order.status === OSStatus.SCHEDULED ? 'INICIAR MONTAGEM' :
                        STATUS_CONFIG[targetStatus].label.split(' ')[0]}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </footer>
        </div >
      </div >


      {/* Hidden Container for WhatsApp PDF Generation & System Print */}
      < PrintStyles />
      <div id="print-layout-v3" className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none print:opacity-100 print:z-[9999] print:cursor-auto print:pointer-events-auto">
        <div id="whatsapp-pdf-content" className="bg-white p-[15mm] font-sans text-slate-900 relative mx-auto shadow-2xl" style={{ width: '210mm', minHeight: '296mm' }}>

          {/* Header Section */}
          <div className="border border-slate-300 rounded-xl p-4 mb-4 flex items-center justify-between bg-slate-50/50">
            <div className="w-[80px] h-[80px] flex items-center justify-center mr-4 shrink-0">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <Wrench className="w-12 h-12 text-slate-300" />
              )}
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-black uppercase text-slate-900 leading-none mb-2">{settings?.nome_oficina || "OFICINA MECÂNICA"}</h1>
              <div className="text-[11px] font-medium text-slate-600 space-y-0.5">
                <p>{settings?.endereco}{settings?.numero ? `, ${settings.numero}` : ''} {settings?.bairro ? `- ${settings.bairro}` : ''}</p>
                <p>Tel: {settings?.telefone} | Email: {settings?.email}</p>
                {settings?.cnpj && <p>CNPJ: {settings?.cnpj}</p>}
              </div>
            </div>
          </div>

          {/* Client and Vehicle Section */}
          <div className="border border-slate-300 rounded-xl mb-4 overflow-hidden">
            <div className="bg-slate-200 py-1.5 px-4 text-center border-b border-slate-300">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">DADOS DO CLIENTE E VEÍCULO</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-slate-900">Cliente: <span className="font-normal">{client?.name || '---'}</span></span>
                <span className="font-bold text-slate-900">Endereço: <span className="font-normal">{client?.address ? `${client.address}, ${client.addressNumber || 'S/N'}${client.neighborhood ? ` - ${client.neighborhood}` : ''}${client.city ? ` - ${client.city}` : ''}${client.state ? `/${client.state}` : ''}${client.zipCode ? ` - CEP ${client.zipCode}` : ''}` : '---'}</span></span>
                <span className="font-bold text-slate-900">Veículo: <span className="font-normal">{vehicle?.model || '---'} {vehicle?.year ? `- ${vehicle.year}` : ''}</span></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-slate-900">Tel: <span className="font-normal">{client?.phone || '---'}</span></span>
                <span className="font-bold text-slate-900">Placa: <span className="font-normal">{vehicle?.plate || '---'}</span></span>

              </div>
            </div>
          </div>

          {/* Items Table Section */}
          <div className="border border-slate-300 rounded-xl mb-4 overflow-hidden flex-1 flex flex-col min-h-[400px]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-300">
                  <th className="py-1.5 px-3 font-black uppercase text-slate-700 border-r border-slate-300 w-12 text-center">#</th>
                  <th className="py-1.5 px-3 font-black uppercase text-slate-700 border-r border-slate-300">DESCRIÇÃO DO SERVIÇO / PEÇA</th>
                  <th className="py-1.5 px-3 font-black uppercase text-slate-700 border-r border-slate-300 w-24 text-center">UNIDADE</th>
                  <th className="py-1.5 px-3 font-black uppercase text-slate-700 border-r border-slate-300 w-28 text-center">VALOR UNIT.</th>
                  <th className="py-1.5 px-3 font-black uppercase text-slate-700 w-28 text-center">TOTAL ITEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {order.items?.map((item, idx) => (
                  <tr key={item.id} className="even:bg-slate-50/50">
                    <td className="py-2 px-3 border-r border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-800 uppercase">{item.description}</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-center text-slate-600">{item.type === 'PART' ? '1 Un.' : 'Serviço'}</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-center text-slate-600">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {/* Fill empty rows to maintain layout structure */}
                {Array.from({ length: Math.max(0, 12 - (order.items?.length || 0)) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-8">
                    <td className="border-r border-slate-300"></td>
                    <td className="border-r border-slate-300"></td>
                    <td className="border-r border-slate-300"></td>
                    <td className="border-r border-slate-300"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="flex gap-4 h-[180px]">
            {/* Notes */}
            <div className="flex-[4] border border-slate-300 rounded-xl p-3 flex flex-col relative group">
              <h4 className="text-[11px] font-bold text-slate-700 mb-1 flex justify-between">
                Observações:
              </h4>
              <p className="w-full text-[10px] text-slate-500 italic leading-snug whitespace-pre-wrap">
                {localNotes || 'Sem observações adicionais.'}
              </p>
            </div>

            {/* Totals */}
            <div className="flex-[3] border border-slate-300 rounded-xl overflow-hidden flex flex-col text-[11px]">
              <div className="flex justify-between items-center px-4 py-2 border-b border-slate-300">
                <span className="font-bold text-slate-700 uppercase">SUBTOTAL:</span>
                <span className="font-medium text-slate-900">R$ {subtotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 border-b border-slate-300">
                <span className="font-bold text-slate-700 uppercase">DESCONTO:</span>
                <span className="font-medium text-slate-900">
                  {discount > 0 ? (
                    <>
                      {discountType === 'value' ? `R$ ${discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `${discount}%`}
                      <span className="text-[9px] text-slate-400 ml-1">(-R$ {discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                    </>
                  ) : 'R$ 0,00'}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-slate-200 border-b border-slate-300">
                <span className="font-black text-slate-900 uppercase text-xs">TOTAL GERAL:</span>
                <span className="font-black text-slate-900 text-sm">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex-1 flex flex-col justify-end p-4 gap-4">
                <div className="text-[10px] text-slate-500">
                  <span className="font-bold">Data:</span> <span className="border-b border-slate-400 px-2 min-w-[80px] inline-block text-center">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                {/* Signature Block Removed as per user request */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {
        previewDoc && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10" onClick={() => setPreviewDoc(null)}>
            <div className="bg-white rounded-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">{previewDoc.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase">{previewDoc.type} • {new Date(previewDoc.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={previewDoc.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors" title="Abrir em nova guia">
                    <Share2 className="w-5 h-5" />
                  </a>
                  <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-auto p-4 relative">
                {previewDoc.type.includes('IMAGE') || previewDoc.type === 'JPG' || previewDoc.type === 'PNG' ? (
                  <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded shadow-sm" />
                ) : (
                  <iframe src={previewDoc.url} className="w-full h-full rounded border border-slate-200" title="PDF Preview"></iframe>
                )}
              </div>
            </div>
          </div>
        )
      }
      {/* Modal de Confirmação de Aprovação */}
      {
        showApprovalModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">Cliente Aprovou?</h3>
                  <p className="text-sm font-medium text-slate-500">Confirme se o cliente autorizou a execução do serviço.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="py-2.5 px-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-colors"
                  title="Não, ainda não (Cancelar)"
                >
                  Não / Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setShowScheduling(true);
                  }}
                  className="py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  title="Sim, o cliente aprovou"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sim, Aprovou
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Modal de Confirmação de Estorno */}
      {
        revertModal && revertModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                  <Undo2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">Confirmar Estorno</h3>
                  <p className="text-sm font-medium text-slate-500">{revertModal.message}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRevertModal(null)}
                  className="py-2.5 px-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRevert}
                  className="py-2.5 px-4 bg-amber-500 text-white rounded-xl font-black text-xs uppercase hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
                >
                  <Undo2 className="w-4 h-4" />
                  Sim, Estornar
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Modal de Confirmação de Envio (Orçamento) */}
      {
        showBudgetSentModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                  <Share2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">O orçamento foi enviado?</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase">Confirme para avançar a etapa</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowBudgetSentModal(false)}
                  className="py-2.5 px-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-colors"
                  title="Não, ainda não (Voltar)"
                >
                  NÃO
                </button>
                <button
                  onClick={() => {
                    setShowBudgetSentModal(false);
                    finalizeStageChange();
                  }}
                  className="py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  title="Sim, já enviei (Avançar)"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  SIM
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Modal WhatsApp */}
      {
        whatsappModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center space-y-4">

                {whatsappModal.step === 'confirm' && (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                      <Share2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">Enviar via WhatsApp</h3>
                      <p className="text-sm font-medium text-slate-500">Iremos gerar o PDF, salvar na nuvem e criar um link público para enviar na mensagem.</p>
                      <p className="text-xs bg-slate-100 p-2 rounded text-slate-500">Isso permite o envio automático sem precisar baixar arquivos.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setWhatsappModal({ ...whatsappModal, isOpen: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all">Cancelar</button>
                      <button type="button" onClick={handleWhatsAppProcess} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-xs uppercase hover:bg-green-600 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2">Enviar Agora <ArrowRight className="w-4 h-4" /></button>
                    </div>
                  </>
                )}

                {whatsappModal.step === 'processing' && (
                  <>
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto relative">
                      <Activity className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">Processando...</h3>
                      <p className="text-sm font-medium text-slate-500">Gerando PDF e criando link...</p>
                    </div>
                  </>
                )}

                {whatsappModal.step === 'success' && (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-green-600 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">Sucesso!</h3>
                      <p className="text-sm font-medium text-slate-500">Abrindo WhatsApp...</p>
                    </div>
                  </>
                )}

                {whatsappModal.step === 'error' && (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                      <X className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">Erro</h3>
                      <p className="text-sm font-medium text-red-500 max-h-32 overflow-auto">{whatsappModal.message}</p>
                    </div>
                    <div className="pt-2">
                      <button type="button" onClick={() => setWhatsappModal({ ...whatsappModal, isOpen: false })} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 shadow-lg transition-all">Fechar</button>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        )
      }

      {/* Modal de Alerta Genérico */}
      {
        alertModal && alertModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center space-y-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${alertModal.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">{alertModal.title}</h3>
                  <p className="text-sm font-medium text-slate-500 whitespace-pre-line">{alertModal.message}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-1">
                <button
                  onClick={() => setAlertModal(null)}
                  className="py-2.5 px-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-slate-800 shadow-lg transition-all"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Modal de Exclusão de Ordem */}
      {
        showDeleteModal && showDeleteModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">{showDeleteModal.title}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase">Cuidado, essa ação não tem volta!</p>
                </div>
                {showDeleteModal.warnings.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg text-left">
                    <p className="text-[10px] font-black text-red-800 uppercase mb-2">Atenção aos vínculos:</p>
                    <ul className="space-y-1">
                      {showDeleteModal.warnings.map((w, i) => (
                        <li key={i} className="text-[10px] font-bold text-red-600">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="py-2.5 px-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (deleteOrder) deleteOrder(order.id);
                    setShowDeleteModal(null);
                    onClose();
                  }}
                  className="py-2.5 px-4 bg-red-600 text-white rounded-xl font-black text-xs uppercase hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )
      }
      {
        confirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmModal(null)}>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{confirmModal.title}</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">{confirmModal.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="py-3 px-4 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="py-3 px-4 bg-slate-900 text-white font-black text-xs uppercase rounded-xl shadow-lg hover:bg-black transition-all active:scale-95"
                >
                  {confirmModal.confirmLabel || "Sim, Agendar"}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default OSDetailsModal;
