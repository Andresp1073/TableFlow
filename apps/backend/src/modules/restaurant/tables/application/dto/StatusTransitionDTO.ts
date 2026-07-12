export interface StatusTransitionDTO {
  status: string;
  allowedTransitions: string[];
}

export interface StatusChangeResultDTO {
  id: string;
  tableNumber: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
}
