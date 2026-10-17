import { ImageOff, LoaderCircle, RotateCw } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import shared from "@/components/articles/article-library.module.css";
import styles from "./template-library.module.css";
export function ComponentListLoading() {
  return <div role="status" aria-live="polite" aria-label="正在加载组件" className={styles.listLoading}><div className={styles.loadingCaption}><LoaderCircle size={16} className={styles.spinner}/><span>正在加载组件</span></div><div className={styles.componentMasonry} aria-hidden="true">{[110,230,150,280,180,100,250,140,210,160,120,240].map((height,index)=><div className={styles.nativeItem} key={index}><div className={`${styles.nativeSurface} ${styles.skeleton}`} style={{height}}/></div>)}</div></div>;
}
export function TemplateListLoading({noun="模板"}:{noun?:string}={}) {
  return <div role="status" aria-live="polite" aria-label={`正在加载${noun}`} className={styles.listLoading}><div className={styles.loadingCaption}><LoaderCircle size={16} className={styles.spinner}/><span>正在加载{noun}</span></div><div className={styles.grid} aria-hidden="true">{Array.from({length:8},(_,index)=><div className={`${shared.card} ${styles.skeletonCard}`} key={index}><div className={`${styles.cover} ${styles.skeletonCover}`}><div className={styles.skeletonPaper}><i/><i/><div/><i/><i/><i/></div></div><div className={styles.cardBody}><span className={`${styles.skeleton} ${styles.skeletonTitle}`}/><span className={`${styles.skeleton} ${styles.skeletonLabel}`}/></div></div>)}</div></div>;
}
export function TemplatePreviewLoading() {
  return <div className={styles.previewLoading} role="status" aria-live="polite" aria-label="正在加载模板预览"><div className={styles.loadingCaption}><LoaderCircle size={18} className={styles.spinner}/><span>正在加载预览</span></div><div className={styles.previewSkeleton} aria-hidden="true"><div className={`${styles.skeleton} ${styles.previewSkeletonCover}`}/><span className={`${styles.skeleton} ${styles.skeletonTitle}`}/>{Array.from({length:4},(_,index)=><span className={`${styles.skeleton} ${styles.previewSkeletonLine}`} key={index}/>)}<div className={styles.previewSkeletonImages}><i className={styles.skeleton}/><i className={styles.skeleton}/></div>{Array.from({length:3},(_,index)=><span className={`${styles.skeleton} ${styles.previewSkeletonLine}`} key={index}/>)}</div></div>;
}
export function TemplateLoadError({onRetry,onClose,preview=false,noun="模板"}:{onRetry:()=>void;onClose?:()=>void;preview?:boolean;noun?:string}) {
  return <div className={preview ? styles.previewState : styles.listState}><EmptyState icon={ImageOff} title={preview ? "预览暂未加载" : `暂时未能加载${noun}`} description="再试一次，或稍后回来看看。" action={<div className={styles.stateActions}><button className="primary-button" onClick={onRetry}><RotateCw size={15}/>重新加载</button>{onClose && <button className="text-button" onClick={onClose}>返回模板列表</button>}</div>}/></div>;
}
