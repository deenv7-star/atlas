import { createClientFromRequest } from "npm:@base44/sdk";

// Plan property limits
const PLAN_LIMITS = {
  starter: 1,
  pro: 5,
  business: 10,
  enterprise: 999
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyName, orgId } = await req.json();

    if (!propertyName || !orgId) {
      return Response.json(
        { error: "Property name and org ID are required" },
        { status: 400 }
      );
    }

    // Get user's plan from organization
    const orgs = await base44.entities.Organization.filter({ id: orgId });
    if (!orgs || orgs.length === 0) {
      return Response.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const org = orgs[0];
    const plan = org.plan || "starter";
    const propertyLimit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 1;

    // Count existing properties for this org
    const existingProperties = await base44.entities.Property.filter({
      org_id: orgId
    });
    
    const propertyCount = existingProperties?.length || 0;

    // Check if at limit
    if (propertyCount >= propertyLimit) {
      return Response.json(
        {
          error: `Property limit reached`,
          message: `Your ${plan} plan allows ${propertyLimit} property/ies. You currently have ${propertyCount}.`,
          currentCount: propertyCount,
          limit: propertyLimit,
          plan: plan
        },
        { status: 429 }
      );
    }

    // Validation passed
    return Response.json({
      success: true,
      message: `Property creation allowed. (${propertyCount + 1}/${propertyLimit})`,
      currentCount: propertyCount,
      limit: propertyLimit,
      plan: plan
    });

  } catch (error) {
    console.error("Validation error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Validation failed" },
      { status: 500 }
    );
  }
});