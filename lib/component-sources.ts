import { templateSources, type SourceTemplate, type TemplateResult } from "./template-sources";
import type { TemplatePreview } from "./template-sources/preview";
export type NativeComponent = SourceTemplate & { kind: string; categoryPath: string[]; preview: TemplatePreview };
export type ComponentResult = Omit<TemplateResult,"items"> & {items: NativeComponent[]};
export const componentSources = templateSources.filter(source=>source.id!=="135-official");
