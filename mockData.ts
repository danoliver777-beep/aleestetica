
import { Pet, Service, Appointment, AppStatus } from './types';

export const MOCK_PETS: Pet[] = [
  {
    id: 'p1',
    name: 'Rex',
    breed: 'Golden Retriever',
    age: '3 anos',
    type: 'dog',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPfXLMQ-Ob-HWCWQHDlqR2THvMQpoL0PICSUCDNX2JNwROr43vY4dnvS_IoIg3pDU5HNrWFPdw-cSs0QLVFAb-o8i_X_sCFqq42N5EeSf2ssZpQf3vFlZLn6UcjY3CSCGFMQqE0yYy-qfwwjnxFwFIUfkRTx0uDYXXu6-cwRyWdhBnqG-6UHw_RveQcE0vgbW6RaVikcb3vjd1fQRP40Pwlrg0bj3Guk9_ftIlrERs3_8YMXUziIQnwElgPu0rxQzEMiM7PMqSa_fj',
    status: 'Vacinas em dia'
  },
  {
    id: 'p2',
    name: 'Luna',
    breed: 'Siamês',
    age: '2 anos',
    type: 'cat',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEzFCltLNkxA-MIkDjWUILoiXMJpxcydOYOeZjEPOlVsydKY-WHsKbwmIG6fmTaaojb3WDb6EmDuKt7_J5MVQqgh6w5iIVYlwmRVgiSSHGBstqC5yTu_7CD7B2l09SIOPmgPAskYRNjUhc6W1t1Dg-G2iyf-30tiQY4GSHCCBTyzZgK5AHTvGbpxv4Bk3Ex0CMzmwcxriaMussYM7RY8tAZkgsID3DWtUmOsRN6X18TcrH9sVLkUcROzu1RC8v5deM0P_wMY18GN5d',
    status: 'Check-up pendente'
  }
];

export const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Banho Completo',
    description: 'Higienização completa, corte de unhas e limpeza de ouvidos com produtos premium.',
    price: 60,
    duration: '1h 30m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdcWjxfYqJHja3heW0xo3wsVcQY0alnUVfYKB1stnX1bdJL0Y__PI9P64TLgyAUIw1l4v1QKskMegO9a5DeqwpuL6jsI-QKm73hGPXhCzfaFnVJR3CGPNffrDPlAwAAOGll1XESksi2eBC8SMbVkwwzjiHrkyeOeqSEoEDqYm7jmqqSkY9Z4cV7Thn6zNTNt87iupndkGi4uGcCj8pjv1OnA-sXTgV7H6tiJstwuspVxQWXIwmYX5U5ObH0s-ZqWb5Al0FgHJkIwrk',
    rating: 4.9
  },
  {
    id: 's2',
    name: 'Tosa Higiênica',
    description: 'Corte dos pelos nas regiões íntimas e patas para manter a higiene do seu pet.',
    price: 45,
    duration: '45m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNXfd0QVWWYy3oMUKKzpFj9LgkeJN0yDw0iKUl3i-xjK_8xB6mxbadcO6PmRggBT7zJf7JQHTmQQdJ8WX-spC5sLFcSTGfiSEh-CJEXJXQlI97Pvq4fTCmQ4BdugH3Vb-BS6ZS-5-znN7JiwplN8PBOeW-K6XQK5aSYUY5pmK8EblfqSEOyWx42fdNr1TReJeFmLAU073_OF_CseofweytxtXjzzfEf_dytZ77DRBymXUFvYhtI3sAzMTOYVUh8RIxXUIteayNuNZD',
    rating: 4.8
  },
  {
    id: 's3',
    name: 'Hidratação Profunda',
    description: 'Tratamento especial para pelos ressecados, devolvendo brilho e maciez.',
    price: 80,
    duration: '30m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTXuVgLyRC8mFdUGrEC5AjX381tWG2w8EFUb7ozcCWsPNSGSERiv__kX06DFqy2TuzmDDw_POOq6rqCbKPufWIaWCEMqzwLur4zR4maSnu0o9m0wWHTqTnLfGvwNWSYBUDiUk1wZoJimfrtYxURJE-PNeUUyg4PjSVUZ5FEfIu6nJg6E5LE5DnaeHpyV5vNTW6_MWky-T2dDuhhd3l5LjiKh8uObDGs0bPy5Is-K36JBENC8nxtRpA58l4y-3gAuHJ_PzslJObaijp',
    rating: 5.0
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    petId: 'p1',
    serviceId: 's1',
    date: '2023-10-24',
    time: '09:00',
    status: AppStatus.PENDING,
    ownerName: 'Maria Silva',
    price: 60
  },
  {
    id: 'a2',
    petId: 'p2',
    serviceId: 's2',
    date: '2023-10-24',
    time: '11:00',
    status: AppStatus.CONFIRMED,
    ownerName: 'Carlos Souza',
    price: 45
  },
  {
    id: 'a3',
    petId: 'p1',
    serviceId: 's3',
    date: '2023-10-24',
    time: '14:30',
    status: AppStatus.IN_PROGRESS,
    ownerName: 'Ana Paula',
    price: 80
  }
];
