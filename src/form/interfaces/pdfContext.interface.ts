import moment = require("moment");

interface IParticipantUser {
    firstName: string;
    lastName: string;
}

export interface IParticipantChoices {
    id: string;
    choice: string;
    backgroundColor: string;
    order: number;
    requireAccessory?: boolean;
}

interface IParticipantScale {
    name: string;
    choices: IParticipantChoices[];
}

export interface IParticipantAnswer {
    question: string;
    kind: string;
    comment: string;
    images?: IParticipantFile[];
    qualification: number;
    order: number;
    hint?: string;
    optional: boolean;
}

export interface IParticipantFile {
    filename: string;
    url: string;
    mimetype: string;
}

export interface IDamageSelected {
    part: string;
    position: string;
    kind: string;
    severity?: number;
    images?: IParticipantFile[];
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
    answer: IParticipantChoices;
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
    accesories: IParticipantAccessory;
    accesoriesAnswered: IParticipantItem[];
    scale?: IParticipantScale;
    answer?: IParticipantChoices;
}

interface IParticipantAnswerDamage extends IParticipantAnswer {
    name: string;
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
export interface IParticipantCompany {
    name: string;
    image?: IParticipantFile;
}
interface IParticipantVenue {
    name: string;
    code?: string;
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
    startAt?: Date;
    origin: string;
    destination: string;
    signature?: IParticipantFile;
    company?: IParticipantCompany;
    venue?: IParticipantVenue;
}