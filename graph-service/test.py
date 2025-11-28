import pandas as pd
import matplotlib.pyplot as plt
from matplotlib import rcParams

rcParams['font.family'] = 'Meiryo'  

df = pd.read_csv("test.csv", encoding="utf-8")

ax = df.plot(
    x="candidate",
    y="votes",
    kind="bar",
    legend=False
)

ax.set_xlabel("候補者")
ax.set_ylabel("得票数")
ax.set_title("選挙結果（得票数）")

plt.xticks(rotation=0)

plt.tight_layout()
plt.savefig("out/election_result_bar.png")
plt.show()
