package com.akto.interceptor;

import java.util.List;

import com.akto.action.TrafficAction;
import com.akto.action.observe.InventoryAction;
import com.akto.usage.UsageMetricCalculator;
import com.opensymphony.xwork2.ActionInvocation;
import com.opensymphony.xwork2.ActionSupport;
import com.opensymphony.xwork2.interceptor.AbstractInterceptor;

public class CollectionInterceptor extends AbstractInterceptor {

    List<Integer> deactivatedCollections = UsageMetricCalculator.getDeactivated();
    boolean checkDeactivated(int apiCollectionId) {
        return deactivatedCollections.contains(apiCollectionId);
    }

    public final static String errorMessage = "This API is not available for deactivated collections";

    @Override
    public String intercept(ActionInvocation invocation) throws Exception {
        boolean deactivated = false;

        try {
            Object actionObject = invocation.getInvocationContext().getActionInvocation().getAction();

            if (actionObject instanceof InventoryAction) {
                InventoryAction action = (InventoryAction) actionObject;
                deactivated = checkDeactivated(action.getApiCollectionId());
            } else if (actionObject instanceof TrafficAction) {
                TrafficAction action = (TrafficAction) actionObject;
                deactivated = checkDeactivated(action.getApiCollectionId());
            }

        } catch (Exception e) {
        }

        if (deactivated) {
            ((ActionSupport) invocation.getAction())
                    .addActionError(errorMessage);
            return UsageInterceptor.UNAUTHORIZED;
        }

        return invocation.invoke();
    }

}