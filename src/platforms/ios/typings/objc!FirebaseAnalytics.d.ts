
declare class FIRAnalytics extends NSObject {

	static alloc(): FIRAnalytics; // inherited from NSObject

	static appInstanceID(): string;

	static handleEventsForBackgroundURLSessionCompletionHandler(identifier: string, completionHandler: () => void): void;

	static handleOpenURL(url: NSURL): void;

	static handleUserActivity(userActivity: any): void;

	static logEventWithNameParameters(name: string, parameters: NSDictionary<string, any>): void;

	static new(): FIRAnalytics; // inherited from NSObject

	static resetAnalyticsData(): void;

	static setScreenNameScreenClass(screenName: string, screenClassOverride: string): void;

	static setUserID(userID: string): void;

	static setUserPropertyStringForName(value: string, name: string): void;
}
