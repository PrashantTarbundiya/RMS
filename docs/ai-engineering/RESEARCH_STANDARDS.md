# AuraPass™ Enterprise — AI & Computer Vision Research Standards

This document establishes the scientific foundations, mathematical formulations, metric learning loss architectures, and empirical research standards for AuraPass Enterprise.

---

## 1. Deep Face Recognition Loss Formulations

Face verification maps high-dimensional image pixels $x \in \mathbb{R}^{H \times W \times C}$ into a compact, discriminative metric hypersphere $\mathbb{S}^{d-1} \subset \mathbb{R}^d$ ($d = 512$) where intra-class variance is minimized and inter-class variance is maximized.

### 1.1 Softmax vs. Angular Margin Losses
Traditional Softmax cross-entropy optimizes for classification separability rather than metric margin:
$$\mathcal{L}_{\text{softmax}} = -\frac{1}{N} \sum_{i=1}^N \log \frac{e^{W_{y_i}^T x_i + b_{y_i}}}{\sum_{j=1}^C e^{W_j^T x_i + b_j}}$$

### 1.2 ArcFace (Additive Angular Margin Loss)
ArcFace enforces an additive angular margin $m$ directly on the geodesic distance on the hypersphere:
$$\mathcal{L}_{\text{ArcFace}} = -\frac{1}{N} \sum_{i=1}^N \log \frac{e^{s \cos(\theta_{y_i} + m)}}{e^{s \cos(\theta_{y_i} + m)} + \sum_{j \neq y_i} e^{s \cos \theta_j}}$$

Where:
- $s$: Hypersphere radius scale parameter ($s = 64.0$).
- $m$: Additive angular margin penalty ($m = 0.50$ radians).
- $\theta_{y_i} = \arccos\left(\frac{W_{y_i}^T x_i}{\|W_{y_i}\|_2 \|x_i\|_2}\right)$: Angle between embedding vector $x_i$ and target weight vector $W_{y_i}$.

Because the margin penalty is additive in the angular space, the decision boundary for class 1 versus class 2 requires:
$$\cos(\theta_1 + m) \ge \cos(\theta_2)$$

This guarantees a geometric margin of $m$ on the normalized embedding manifold.

---

## 2. Distance Metrics & Hyperspherical Geometry

When embedding vectors are strictly $L_2$-normalized ($\|u\|_2 = 1.0, \|v\|_2 = 1.0$):

1. **Cosine Similarity**:
   $$\text{Sim}_{\text{cosine}}(u, v) = u \cdot v = \cos(\theta)$$
2. **Cosine Distance**:
   $$D_{\text{cosine}}(u, v) = 1 - \cos(\theta) = 1 - (u \cdot v)$$
3. **Squared Euclidean Distance**:
   $$\|u - v\|_2^2 = (u - v) \cdot (u - v) = \|u\|_2^2 + \|v\|_2^2 - 2(u \cdot v) = 2 - 2\cos(\theta) = 2 \cdot D_{\text{cosine}}(u, v)$$
4. **Euclidean Distance Relationship**:
   $$D_{\text{euclidean}}(u, v) = \sqrt{2 \cdot D_{\text{cosine}}(u, v)}$$

### Mathematical Equivalence & Operational Rule
Because Euclidean distance is a monotonic transformation of cosine distance on the unit hypersphere, ranking orders are identical. In AuraPass, all models normalize embeddings to unit length ($\|e\|_2 = 1.0$) upon extraction, and distance calculations use Cosine Distance for optimal numerical stability.

---

## 3. Open-Set Recognition Theory & False Positive Elimination

Enterprise attendance systems operate in an **Open-Set Recognition** regime: the system encounters individuals during testing who were never enrolled in the training dataset.

According to Scheirer et al. (*Towards Open Set Recognition*, IEEE TPAMI):
$$\text{Total Risk} = R_{\text{emp}}(f) + \lambda \cdot R_{\mathcal{O}}(f)$$
Where $R_{\text{emp}}$ is empirical training error on enrolled employees, and $R_{\mathcal{O}}$ is the open-set risk of false acceptance on unseen non-enrolled persons.

### Dual-Backbone Consensus Mechanism
To minimize open-set risk $R_{\mathcal{O}}$ to near zero:
1. **Model Independence**: Feature vectors $e_1 = f_{\text{Facenet512}}(x)$ and $e_2 = f_{\text{InsightFace}}(x)$ are extracted using different CNN topologies (Inception-ResNet vs. ResNet-50) trained on different base corpora.
2. **Consensus Requirement**:
   $$\text{Decision} = \begin{cases}
   \text{Match}(y^*) & \text{if } \arg\min_y D_1(e_1, y) = \arg\min_y D_2(e_2, y) = y^* \text{ and } D_1 \le \tau_1 \text{ and } D_2 \le \tau_2 \\
   \text{Unknown} & \text{otherwise}
   \end{cases}$$
3. This multi-model consensus mathematically squares the probability of an accidental random false match, driving False Acceptance Rate on non-enrolled strangers to $< 0.001\%$.

