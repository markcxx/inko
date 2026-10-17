import { fetch96Components, fetchXmyComponents, fetchXiumiComponents } from "@/lib/component-sources/providers";
export async function GET(request:Request) {
  const params=new URL(request.url).searchParams,source=params.get("source");
  const provider=source==="96"?fetch96Components:source==="xmy"?fetchXmyComponents:source==="xiumi"?fetchXiumiComponents:null;
  if(!provider)return Response.json({error:"该来源暂无独立组件库。"},{status:400});
  try{return Response.json(await provider(params),{headers:{"Cache-Control":"no-store"}});}
  catch(error){console.error("Component source request failed",source,error);return Response.json({error:"暂时无法加载组件，请稍后重试。"},{status:502});}
}
