// Only read operations are retried. Every wake-up invalidates an old network request.
export function createReconnection({probe,apply,status,error,delay=ms=>new Promise(r=>setTimeout(r,ms)),delays=[0,700,2000,5000]}){
 let epoch=0,disposed=false,abort=null;
 function invalidate(){epoch++;abort?.();abort=null;}
 return {
  async recover(){invalidate();const ticket=epoch;status('checking');
   for(let n=0;n<delays.length;n++){
    if(delays[n])await delay(delays[n]);if(disposed||ticket!==epoch)return;
    try{const request=probe();abort=request.abort;const value=await request.result;if(disposed||ticket!==epoch)return;await apply(value);if(ticket===epoch){status('connected');error('');}return true;}
    catch(e){if(disposed||ticket!==epoch)return;if([401,403].includes(e.status)||n===delays.length-1){status('offline');error(e.message);return false;}}
   }
  },
  offline(){invalidate();status('offline');},suspend(){invalidate();},dispose(){disposed=true;invalidate();},
 };
}
