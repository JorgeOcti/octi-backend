import moment = require("moment");

interface IParticipantUser {
    firstName: string;
    lastName: string;
}

interface IParticipantChoices {
    id: string;
    choice: string;
    backgroundColor: string;
    order: number;
}

interface IParticipantScale {
    name: string;
    choices: IParticipantChoices[];
}

export interface IParticipantAnswer {
    question: string;
    kind: string;
    comment: string;
    answer?: string;
    images?: IParticipantFile[];
    qualification: number;
    order: number;
    hint?: string;
    optional: boolean;
}

interface IParticipantFile {
    filename: string;
    url: string;
    mimetype: string;
}

interface IDamageSelected {
    part: string;
    position: string;
    kind: string;
    severity?: number;
}

interface IParticipantItem {
    item: string;
    amount: boolean;
}

interface IParticipantAccessory {
    question: string;
    items: IParticipantItem[];
}

interface IMatrixItem {
    question: string;
    name: string;
    type: string;
    value?: string;
    images?: IParticipantFile[];
}

interface IMatrix {
    name: string;
    questions: IMatrixItem[];
}

interface IParticipantAnswerScale extends IParticipantAnswer {
    scale: IParticipantScale;
    answer: string;
}

interface IParticipantAnswerNumericScale extends IParticipantAnswer {
    scale: IParticipantScale;
    score: number;
    minValue: number;
    maxValue: number;
}

interface IParticipantAnswerText extends IParticipantAnswer {
}

interface IParticipantAnswerAccessory extends IParticipantAnswer {
    accessories: IParticipantAccessory;
    accesoriesAnswered: Array<{ item: string }>;
    scale?: IParticipantScale;
    answer?: string;
}

interface IParticipantAnswerDamage extends IParticipantAnswer {
    damagesSelected: IDamageSelected[];
}

interface IParticipantAnswerImage extends IParticipantAnswer {
    images: IParticipantFile[];
}

interface IParticipantAnswerVenue extends IParticipantAnswer {
}

interface IParticipantAnswerCarrier extends IParticipantAnswer {
}

interface IParticipantAnswerMatrix extends IParticipantAnswer {
    matrix: IMatrix;
    matrixValues: IMatrixItem[][];
}

export type IParticipantAnswerTypes = 
    | IParticipantAnswerScale
    | IParticipantAnswerNumericScale
    | IParticipantAnswerText
    | IParticipantAnswerAccessory
    | IParticipantAnswerDamage
    | IParticipantAnswerImage
    | IParticipantAnswerVenue
    | IParticipantAnswerCarrier
    | IParticipantAnswerMatrix;

export interface IParticipantSection {
    name: string;
    answers: IParticipantAnswerTypes[];
}

interface IParticipantProcess {
    is: boolean;
    text?: string;
    images?: string[];
}

interface IParticipantCar {
    vin: string;
    internalNumber: string;
    engineNumber: string;
    brand: string;
    denomination: string;
    color: string;
    patent: string;

}

export interface IPDFContext {
    css?: string;
    qr: string;
    moment: typeof moment;
    name: string;
    description: string;
    number: number;
    user: IParticipantUser;
    carrier: IParticipantProcess;
    sections: IParticipantSection[];
    shipping: IParticipantProcess;
    reception: IParticipantProcess;
    conciliation: IParticipantProcess;
    car: IParticipantCar;
    createdAt?: Date;
    logo: string | false;
    // Helper functions for template usage
    origin: string;
    destination: string;
    getAnswer: (scale: any, answer: any) => string;
    requireAccesory: (scale: any, answer: any) => boolean;
    getDamageItem: (items: any, item: string) => string;
    accesorySelected: (answer: any, item: any) => any;
}