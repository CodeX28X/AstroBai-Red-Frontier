import { useRef, useState, type ReactNode } from 'react'
import { Dialog } from './Dialog'
import { ActionButton } from './ActionButton'

export function ConfirmationDialog({title,children,validate,onConfirm,onClose}:{title:string;children:ReactNode;validate:()=>string|undefined;onConfirm:()=>void|Promise<void>;onClose:()=>void}) {
  const [error,setError]=useState(''),[busy,setBusy]=useState(false)
  const running=useRef(false)
  async function confirm(){
    if(running.current)return
    const reason=validate()
    if(reason){setError(reason);return}
    running.current=true;setBusy(true);setError('')
    try{await onConfirm();onClose()}
    catch(cause){setError(cause instanceof Error?cause.message:'Please check this action before trying again.');running.current=false;setBusy(false)}
  }
  return <Dialog title={title} onClose={()=>{if(!running.current)onClose()}}><div className="confirmation-copy">{children}</div>{error&&<p role="alert" className="confirmation-error">{error}</p>}<div className="choice-row confirmation-actions"><button type="button" autoFocus disabled={busy} onClick={onClose}>Cancel</button><button className="primary" type="button" disabled={busy} onClick={()=>void confirm()}>{busy?'Working…':'Confirm'}</button></div>{busy&&<p role="status">Please wait. This action will run once.</p>}</Dialog>
}
export function ConfirmActionButton({label,title,children,validate,onConfirm,blockedReason,className='primary'}:{label:string;title:string;children:ReactNode;validate:()=>string|undefined;onConfirm:()=>void|Promise<void>;blockedReason?:string;className?:string}){
  const [open,setOpen]=useState(false)
  return <><ActionButton className={className} blockedReason={blockedReason} onClick={()=>setOpen(true)}>{label}</ActionButton>{open&&<ConfirmationDialog title={title} validate={validate} onConfirm={onConfirm} onClose={()=>setOpen(false)}>{children}</ConfirmationDialog>}</>
}
