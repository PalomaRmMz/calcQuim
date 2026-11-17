import {ticketModel} from './ticket.mjs';
export function receiptForView(receipts,{receiptId,officialReceipt}={}){
 const candidate=officialReceipt??receipts?.find(r=>r.id===receiptId);
 if(!candidate)return null;
 const version=candidate.version??1;
 if(candidate.id!==receiptId||!Number.isSafeInteger(version)||version<1)throw Error('El comprobante no corresponde a la venta solicitada.');
 if(officialReceipt&&version>1&&candidate.corrected!==true)throw Error('La revisión del comprobante no está identificada.');
 ticketModel(candidate);return candidate;
}
