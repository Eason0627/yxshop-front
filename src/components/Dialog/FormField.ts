export interface FormField<T> {
  type:
    | "uploader"
    | "text"
    | "textarea"
    | "number"
    | "double"
    | "datepicker"
    | "datetime"
    | "select"
    | "checkbox"
    | "radio"
    | "varchar"
    ;
  label: string;
  prop: keyof T;
  show: boolean;
  tips?: string;
  placeholder?: string;
  rules?: Array<{
    type?: "string" | "number";
    min?: number;
    max?: number;
    required?: boolean;
    message?: string;
    trigger: "blur";
  }>;
  max?: number;
  min?: number;
  options?: {
    label: string;
    value: any;
    id?: string;
    disabled?: boolean;
    tips?: string;
  }[];
  loading?: boolean;
  multiple?: boolean;
  remote?: boolean;
  uploadConfig?: any;
  group?: string;
  HTML?: string;
  fetchOptions?: (query: string) => void;
  onChange?: (value: any, field: FormField<T>) => void;
  onFocus?: (value: any, field: FormField<T>) => void;
}

export interface DialogFormProps<T> {
  title: string;
  visible: boolean;
  labelPosition: any;
  fields: FormField<T>[];
}
