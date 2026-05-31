export interface GenerateDamOption {
  codigo: string;
  descripcion: string;
}

export interface GenerateDamCountryOption {
  codigo: string;
  descripcion: string;
}

export interface GenerateDamSeaportOption {
  codigo: string;
  descripcion: string;
  label: string;
}

export interface GenerateDamArancelOption {
  cleanCode: string;
  description: string;
}

export interface GenerateDamFileDescriptor {
  file: File;
}
