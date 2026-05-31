import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  AiPythonArancelBatchResponseDto,
  AiPythonArancelClassifyResponseDto,
  ClassifyArancelBatchRequest,
  ClassifyArancelRequest,
  ProcessAiOcrRequest,
  ProcessBolOcrResponseDto,
  ProcessInvoiceOcrResponseDto
} from './ai.types';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly httpClient = inject(HttpClient);
  private readonly aiUrl = `${environment.apiUrl}/api/Ai`;

  processInvoice(request: ProcessAiOcrRequest) {
    // const formData = new FormData();
    // formData.set('file', request.file);

    // return this.httpClient.post<ApiResultOf<ProcessInvoiceOcrResponseDto>>(`${this.aiUrl}/ocr/invoice`, formData);
    const mockResponse: ApiResultOf<ProcessInvoiceOcrResponseDto> = {
    "data": {
        "rawOcr": "",
        "message": "Success",
        "isError": false,
        "invoice": {
            "provider": {
                "name": "NMT INTERNATIONAL SHIPPING BV",
                "address": "GORSLAAN 30",
                "refNumber": null,
                "zip": null,
                "phone": null,
                "email": null,
                "country": null,
                "city": null
            },
            "invoiceNumber": "87798",
            "customerId": "0",
            "totalAmount": 85000.0,
            "date": "2025-12-24",
            "totalItems": 2,
            "items": [
                {
                    "name": "Cosechadora 9760STS",
                    "comercialDescription": "Cosechadora John Deere 9760STS",
                    "type": "Cosechadora",
                    "class": "Agricola",
                    "model": "9760STS",
                    "composition": "Metal",
                    "otherDetails": "SERIAL:H09760S721857",
                    "year": "2006",
                    "quantity": 1.0,
                    "unitPrice": 50000.0,
                    "amount": 50000.0
                },
                {
                    "name": "Cosechadora 9650STS",
                    "comercialDescription": "Cosechadora John Deere 9650STS",
                    "type": "Cosechadora",
                    "class": "Agricola",
                    "model": "9650STS",
                    "composition": "Metal",
                    "otherDetails": "SERIAL:H09650S701078",
                    "year": "2003",
                    "quantity": 1.0,
                    "unitPrice": 35000.0,
                    "amount": 35000.0
                }
            ]
        }
    },
    "isValid": true,
    "messageList": [
        {
            "description": "Operacion realizada exitosamente",
            "type": 3
        }
    ]
};
return of(mockResponse);
  }

  processBol(request: ProcessAiOcrRequest) {
    // const formData = new FormData();
    // formData.set('file', request.file);

    // return this.httpClient.post<ApiResultOf<ProcessBolOcrResponseDto>>(`${this.aiUrl}/ocr/bol`, formData);
    const mockResponse: ApiResultOf<ProcessBolOcrResponseDto> = {
    "data": {
        "rawOcr": "",
        "message": "Success",
        "isError": false,
        "bol": {
            "consigneeDocNumber": "424145029",
            "shipperDocNumber": "424145029",
            "bolNumber": "NYKS300045692",
            "date": "2025-12-24",
            "place": {
                "destinationCountry": "Estados Unidos",
                "originCountry": "Estados Unidos",
                "transitCountry": "Chile",
                "transitCity": "Iquique",
                "portOfLoading": "FREEPORT, TX",
                "countryOfLoading": "Estados Unidos"
            },
            "totalWeight": 29000.0,
            "totalPackages": 4,
            "totalItems": 4,
            "items": [
                {
                    "quantity": 1.0,
                    "description": "USED 2006 JOHN DEERE 9760STS COMBINE S/N:H09760S721857 UNDER DECK STOWAGE REQUIRED",
                    "weight": 14200.0
                },
                {
                    "quantity": 1.0,
                    "description": "PALLET WITH TIRES FOR USED 2006 JOHN DEERE 9760STS COMBINE S/N:H09760S721857 UNDER DECK STOWAGE REQUIRED",
                    "weight": 300.0
                },
                {
                    "quantity": 1.0,
                    "description": "USED 2003 JOHN DEERE 9650STS COMBINE S/N:H09650S701078 UNDER DECK STOWAGE REQUIRED",
                    "weight": 14200.0
                },
                {
                    "quantity": 1.0,
                    "description": "PALLET WITH TIRES FOR USED 2003 JOHN DEERE 9650STS COMBINE S/N:H09650S701078 IN TRANSIT TO BOLIVIA BY CONSIGNEE'S RISK AND ACCOUNT UNDER DECK STOWAGE REQUIRED",
                    "weight": 300.0
                }
            ]
        }
    },
    "isValid": true,
    "messageList": [
        {
            "description": "Operacion realizada exitosamente",
            "type": 3
        }
    ]
};
return of(mockResponse);
  }

  classifyArancel(request: ClassifyArancelRequest) {
    return this.httpClient.post<ApiResultOf<AiPythonArancelClassifyResponseDto>>(`${this.aiUrl}/arancel/classify`, request);
  }

  classifyArancelBatch(request: ClassifyArancelBatchRequest) {
    //return this.httpClient.post<ApiResultOf<AiPythonArancelBatchResponseDto>>(`${this.aiUrl}/arancel/classify-batch`, request);
    const mockResponse: ApiResultOf<AiPythonArancelBatchResponseDto> = {
    "data": {
        "results": [
            {
                "id": "0",
                "description": "Cosechadora 9760STS",
                "partidas": [
                    {
                        "code": "8433.51.00.00",
                        "description": "- - Cosechadoras-trilladoras",
                        "reasoning": "El producto es una cosechadora 9760STS, que es una máquina para cosechar, por lo que corresponde a la partida 8433.51.00.00 que clasifica cosechadoras-trilladoras."
                    },
                    {
                        "code": "8433.59.10.90",
                        "description": "- - - - Las demás",
                        "reasoning": "Si la cosechadora no es una trilladora, podría clasificarse en la partida residual 8433.59.10.90 para máquinas de cosechar no eléctricas."
                    },
                    {
                        "code": "8432.80.00.00",
                        "description": "- Las demás máquinas, aparatos y artefactos",
                        "reasoning": "Si la máquina tiene funciones agrícolas pero no es específicamente una cosechadora, podría clasificarse en esta partida general para máquinas agrícolas."
                    },
                    {
                        "code": "8426.99.90.00",
                        "description": "- - - Los demás",
                        "reasoning": "Si la cosechadora tiene funciones de manipulación o carga, podría considerarse en esta partida residual para máquinas de elevación y manipulación."
                    },
                    {
                        "code": "8479.10.00.00",
                        "description": "- Máquinas y aparatos para obras públicas, la construcción o trabajos análogos",
                        "reasoning": "Si la máquina no encaja en las partidas específicas anteriores, podría clasificarse en esta partida residual para máquinas mecánicas con función propia no expresadas en otras partidas."
                    }
                ]
            },
            {
                "id": "1",
                "description": "Cosechadora 9650STS",
                "partidas": [
                    {
                        "code": "8433.51.00.00",
                        "description": "- - Cosechadoras-trilladoras",
                        "reasoning": "El producto es una cosechadora 9650STS, que es una máquina para cosechar. Según el texto, las máquinas y aparatos de cosechar están en la partida 8433.51.00.00, que corresponde específicamente a cosechadoras-trilladoras."
                    },
                    {
                        "code": "8701.10.00.90",
                        "description": "- - Los demás",
                        "reasoning": "Si la cosechadora es autopropulsada y funciona como tractor agrícola, podría clasificarse en la partida 8701.10.00.90, que cubre tractores de un solo eje, no eléctricos."
                    },
                    {
                        "code": "8433.59.10.90",
                        "description": "- - - - Las demás",
                        "reasoning": "Para máquinas de cosechar que no sean cosechadoras-trilladoras ni eléctricas, la partida 8433.59.10.90 es aplicable."
                    },
                    {
                        "code": "8433.59.10.10",
                        "description": "- - - - Eléctricas",
                        "reasoning": "Si la cosechadora fuera eléctrica, esta partida sería aplicable, pero generalmente las cosechadoras son autopropulsadas con motor de combustión."
                    },
                    {
                        "code": "8479.10.00.00",
                        "description": "- Máquinas y aparatos para obras públicas, la construcción o trabajos análogos",
                        "reasoning": "Si la máquina tuviera múltiples funciones o no se pudiera determinar su función principal, podría clasificarse en la partida residual 8479.10.00.00, pero dado que es una cosechadora, la partida 8433.51.00.00 es más específica."
                    }
                ]
            }
        ]
    },
    "isValid": true,
    "messageList": [
        {
            "description": "Operacion realizada exitosamente",
            "type": 3
        }
    ]
};
return of(mockResponse);
  }
}
