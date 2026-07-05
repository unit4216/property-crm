// Shared "success" look for buttons that just completed a create/update/delete
// action — black background with lime green text/spinner, distinct from the
// default primary/error button colors.
// The button is disabled while showing this state (to block resubmission),
// so these colors must also win against MUI's `.Mui-disabled` styling.
export const successButtonSx = {
  backgroundColor: "#000",
  color: "#a3e635",
  "&:hover": { backgroundColor: "#000" },
  "&.Mui-disabled": {
    backgroundColor: "#000",
    color: "#a3e635",
  },
} as const;
