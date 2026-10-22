const TOKEN_KEY='stockwise.session';
export const session={get:()=>sessionStorage.getItem(TOKEN_KEY),set:token=>sessionStorage.setItem(TOKEN_KEY,token),clear:()=>sessionStorage.removeItem(TOKEN_KEY)};
export async function api(path,{method='GET',body,signal}={}){
 let response;
 try{response=await fetch(`/api${path}`,{method,signal,headers:{'Content-Type':'application/json',...(session.get()?{Authorization:`Bearer ${session.get()}`}:{})},...(body?{body:JSON.stringify(body)}:{})})}catch(error){if(error.name==='AbortError')throw error;throw new Error('Cannot reach the server. Check your connection and try again.')}
 const data=await response.json().catch(()=>({error:'The server returned an unexpected response.'}));
 if(!response.ok){if(response.status===401&&!['/auth/login','/auth/register'].includes(path)){session.clear();window.dispatchEvent(new Event('session-ended'))}const error=new Error(data.error||'Request failed.');error.status=response.status;error.details=data.details;throw error}return data;
}
