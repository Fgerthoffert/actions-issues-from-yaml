export declare function areReposValid(configRepos: string[], gitHubRepos: GitHubRepo[]): boolean;
export declare function areIssueTypesValid(configIssueTypes: ConfigIssueType[], gitHubIssueTypes: GitHubIssueType[]): boolean;
export declare function areMilestonesValid(configMilestones: ConfigMilestone[], gitHubMilestones: GitHubMilestone[], createMilestones: boolean): Promise<boolean>;
export declare function areProjectsValid(configProjects: ConfigProject[], gitHubProjects: GitHubProject[]): Promise<boolean>;
