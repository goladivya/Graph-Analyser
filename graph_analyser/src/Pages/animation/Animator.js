export async function playSteps(cy, steps, delay = 600) {
    for (let step of steps) {
        if (step.type === "WAIT") {
            await new Promise(res => setTimeout(res, step.duration));
            continue;
        }
        applyStep(cy, step);
        await new Promise(res => setTimeout(res, delay));
    }
}

function applyStep(cy, step) {
    switch (step.type) {

        case "VISIT_NODE":
            cy.getElementById(step.node)
                .addClass("visited");
            break;

        case "RELAX_EDGE":
            cy.getElementById(step.edge)
                .addClass("relaxed");
            break;

        case "COLOR_NODE":
            cy.getElementById(step.node)
                .style("background-color", step.color);
            break;

        case "COLOR_EDGE":
            cy.getElementById(step.edge)
                .style("line-color", step.color);
            break;

        case "UPDATE_LABEL":
            cy.getElementById(step.node)
                .style("label", step.label);
            break;

        case "HIGHLIGHT_PATH":
            step.path.forEach(id => {
                cy.getElementById(id).addClass("final-path");
            });
            break;

        case "CLEAR_GRAPH":
            cy.elements().remove();
            break;

        case "ADD_NODE":
            cy.add({
                group: "nodes",
                data: step.node,
                position: {
                    x: Math.random() * 600,
                    y: Math.random() * 400
                }
            });
            break;

        case "ADD_EDGE":
            cy.add({
                group: "edges",
                data: step.edge
            });
            break;

        case "REMOVE_EDGE":
            const edge = cy.getElementById(step.edgeId);
            if (edge) edge.remove();
            break;

        case "APPLY_LAYOUT":
            cy.layout({ name: step.layout }).run();
            break;

        case "WAIT":

            break;

       

    }
}