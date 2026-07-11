export declare const BUSINESS_TZ = "Asia/Kolkata";
export declare function getBusinessDateString(date?: Date): string;
export declare function parseBusinessDate(dateStr: string): Date;
export declare function getBusinessDayUtcRange(dateStr?: string): {
    start: Date;
    end: Date;
};
export declare function getBusinessMonthStartUtc(date?: Date): Date;
