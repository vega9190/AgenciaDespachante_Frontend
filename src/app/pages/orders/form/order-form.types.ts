export interface DocumentSectionItem {
  id: string;
  name: string;
  icon: string;
  orderDocumentTypeId: string;
  sizeLabel: string;
  uploadedAtLabel: string;
}

export interface DocumentSectionVm {
  orderDocumentTypeId: string;
  title: string;
  status: number;
  statusLabel: string;
  statusSeverity: 'success' | 'warn' | 'danger' | 'secondary';
  statusIcon: string;
  documentsCount: number;
  documentsCountLabel: string;
  documents: DocumentSectionItem[];
  isDisabled: boolean;
  showRequiredText: boolean;
  showStatus: boolean;
  isApproved: boolean;
  canApprove: boolean;
  isApproveConfirmOpen: boolean;
  isApproving: boolean;
}
