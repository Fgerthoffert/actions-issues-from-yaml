const updateField = (field: string, variables: ConfigVariables[]) => {
  for (const variable of variables) {
    field = field.replace(`{{ var.${variable.name} }}`, variable.value)
  }
  return field
}

export function addVariablesToIssues(
  issues: ConfigIssue[],
  variables: ConfigVariables[]
): ConfigIssue[] {
  return issues.map((issue: ConfigIssue) => {
    console.log(`Adding variables to issue: ${issue.title}`)
    const updatedIssue: ConfigIssue = {
      ...issue,
      title: updateField(issue.title, variables),
      repository: updateField(issue.repository, variables),
      description: issue.description
        ? updateField(issue.description, variables)
        : undefined,
      milestone: issue.milestone
        ? updateField(issue.milestone, variables)
        : undefined,
      type: issue.type ? updateField(issue.type, variables) : undefined,
      project: issue.project
        ? {
            title: updateField(issue.project.title, variables),
            status: issue.project.status
              ? updateField(issue.project.status, variables)
              : undefined
          }
        : undefined,
      children:
        issue.children && issue.children.length > 0
          ? addVariablesToIssues(issue.children, variables)
          : [],
      labels:
        issue.labels && issue.labels.length > 0
          ? issue.labels.map((label: string) => updateField(label, variables))
          : [],
      assignees:
        issue.assignees && issue.assignees.length > 0
          ? issue.assignees.map((assignee: string) =>
              updateField(assignee, variables)
            )
          : []
    }
    return updatedIssue
  })
}
