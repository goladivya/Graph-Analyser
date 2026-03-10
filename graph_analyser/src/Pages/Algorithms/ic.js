export function independentCascadeSteps(cy, seedNodes = [], defaultProb = 0.4) {

    const steps = [];
    const influenced = new Set(seedNodes);
    let newlyInfluenced = new Set(seedNodes);
    let time = 0;

    // Color seed nodes
    seedNodes.forEach(id => {
        steps.push({
            type: "COLOR_NODE",
            node: id,
            color: "green"
        });
    });

    while (newlyInfluenced.size > 0) {

        const nextNew = new Set();

        newlyInfluenced.forEach(vId => {

            const v = cy.getElementById(vId);

            const neighbors = v.outgoers("node");

            neighbors.forEach(w => {

                const wId = w.id();

                if (!influenced.has(wId)) {

                    const edge = v.outgoers(`edge[target = "${wId}"]`)[0];

                    const p = edge?.data("probability") ?? defaultProb;

                    steps.push({
                        type: "COLOR_EDGE",
                        edge: edge.id(),
                        color: "blue"
                    });

                    if (Math.random() < p) {

                        influenced.add(wId);
                        nextNew.add(wId);

                        steps.push({
                            type: "COLOR_NODE",
                            node: wId,
                            color: "yellow"
                        });

                    } else {

                        steps.push({
                            type: "COLOR_EDGE",
                            edge: edge.id(),
                            color: "red"
                        });
                    }
                }
            });

        });

        nextNew.forEach(id => {
            steps.push({
                type: "COLOR_NODE",
                node: id,
                color: "green"
            });
        });

        newlyInfluenced = nextNew;
        time++;
    }

    return {
        steps,
        result: {
            algorithm: "Independent Cascade Model",
            totalInfluenced: influenced.size,
            timeSteps: time
        }
    };
}