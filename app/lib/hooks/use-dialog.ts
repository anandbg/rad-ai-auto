'use client';

import { useState, useCallback } from 'react';

/**
 * Generic dialog state management hook.
 * Handles open/close state and optional data for edit dialogs.
 *
 * This hook consolidates the common pattern of managing:
 * - showDialog + setShowDialog
 * - selectedItem + setSelectedItem
 * - handleOpen + handleClose
 *
 * @template T - The type of data associated with the dialog (e.g., User, Template)
 *
 * @example
 * ```tsx
 * // For a simple confirm dialog (no data)
 * const deleteDialog = useDialog();
 * <Button onClick={deleteDialog.open}>Delete</Button>
 * <Dialog open={deleteDialog.isOpen} onOpenChange={deleteDialog.setIsOpen}>
 *
 * // For an edit dialog with data
 * const editDialog = useDialog<User>();
 * <Button onClick={() => editDialog.openWith(user)}>Edit</Button>
 * <Dialog open={editDialog.isOpen} onOpenChange={editDialog.setIsOpen}>
 *   {editDialog.data && <EditForm user={editDialog.data} onSave={editDialog.close} />}
 * </Dialog>
 *
 * // With type safety
 * const { isOpen, data, openWith, close } = useDialog<Template>();
 * // data is typed as Template | null
 * ```
 */
export function useDialog<T = void>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  /**
   * Open the dialog without any data.
   * Useful for confirmation dialogs or creating new items.
   */
  const open = useCallback(() => {
    setIsOpen(true);
    setData(null);
  }, []);

  /**
   * Open the dialog with associated data.
   * Useful for edit dialogs where you need to pass the item being edited.
   */
  const openWith = useCallback((item: T) => {
    setData(item);
    setIsOpen(true);
  }, []);

  /**
   * Close the dialog and clear any associated data.
   */
  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  /**
   * Toggle the dialog open/close state.
   */
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    /** Whether the dialog is currently open */
    isOpen,
    /** Data associated with the dialog (null if opened without data) */
    data,
    /** Open the dialog without data */
    open,
    /** Open the dialog with data */
    openWith,
    /** Close the dialog and clear data */
    close,
    /** Toggle the dialog state */
    toggle,
    /** Direct setter for data (for advanced use cases) */
    setData,
    /** Direct setter for open state (for Radix UI onOpenChange) */
    setIsOpen,
  };
}

/**
 * Type helper for components that receive dialog state as props.
 *
 * @example
 * ```tsx
 * interface EditUserDialogProps {
 *   dialog: DialogState<User>;
 * }
 *
 * function EditUserDialog({ dialog }: EditUserDialogProps) {
 *   return (
 *     <Dialog open={dialog.isOpen} onOpenChange={dialog.setIsOpen}>
 *       {dialog.data && <Form user={dialog.data} />}
 *     </Dialog>
 *   );
 * }
 * ```
 */
export type DialogState<T> = ReturnType<typeof useDialog<T>>;
