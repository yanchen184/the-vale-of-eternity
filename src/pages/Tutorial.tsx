/**
 * Tutorial page component
 * @version 1.0.0
 */
console.log('[pages/Tutorial.tsx] v1.0.0 loaded')

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Droplets, Mountain, Wind, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export function Tutorial() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4"
      data-testid="tutorial-page"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="py-6">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/')}
            data-testid="back-btn"
          >
            返回首頁
          </Button>
          <h1 className="text-3xl font-bold text-slate-100 mt-4">遊戲教學</h1>
          <p className="text-slate-400 mt-2">學習如何遊玩《永恆之谷》</p>
        </header>

        {/* Tutorial Content */}
        <main className="space-y-8 pb-12">
          {/* Game Overview */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-vale-400 mb-4">遊戲概述</h2>
            <p className="text-slate-300 leading-relaxed">
              《永恆之谷》是一款 2-4 人的卡牌收集遊戲。玩家扮演召喚師，透過收集神話生物卡片來累積分數。
              遊戲進行 4 個回合，每回合玩家輪流從市場獲取卡片或使用能力。遊戲結束時，分數最高的玩家獲勝！
            </p>
          </section>

          {/* Elements */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-vale-400 mb-4">四大元素</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-fire/10 rounded-lg border border-fire/30">
                <Flame className="h-10 w-10 text-fire mx-auto" />
                <p className="font-medium text-fire mt-2">火</p>
                <p className="text-sm text-slate-400 mt-1">攻擊性強</p>
              </div>
              <div className="text-center p-4 bg-water/10 rounded-lg border border-water/30">
                <Droplets className="h-10 w-10 text-water mx-auto" />
                <p className="font-medium text-water mt-2">水</p>
                <p className="text-sm text-slate-400 mt-1">抽牌能力</p>
              </div>
              <div className="text-center p-4 bg-earth/10 rounded-lg border border-earth/30">
                <Mountain className="h-10 w-10 text-earth mx-auto" />
                <p className="font-medium text-earth mt-2">地</p>
                <p className="text-sm text-slate-400 mt-1">高分數</p>
              </div>
              <div className="text-center p-4 bg-slate-500/10 rounded-lg border border-slate-500/30">
                <Wind className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="font-medium text-slate-300 mt-2">風</p>
                <p className="text-sm text-slate-400 mt-1">靈活操作</p>
              </div>
            </div>
          </section>

          {/* Turn Structure */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-vale-400 mb-4">回合流程</h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-vale-600 rounded-full flex items-center justify-center font-bold text-slate-100">
                  1
                </span>
                <div>
                  <h3 className="font-medium text-slate-200">抽牌階段</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    從牌堆抽取 1 張卡片加入手牌
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-vale-600 rounded-full flex items-center justify-center font-bold text-slate-100">
                  2
                </span>
                <div>
                  <h3 className="font-medium text-slate-200">行動階段</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    可選擇：打出手牌、購買市場卡片、使用生物能力
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-vale-600 rounded-full flex items-center justify-center font-bold text-slate-100">
                  3
                </span>
                <div>
                  <h3 className="font-medium text-slate-200">結束階段</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    若手牌超過上限，棄掉多餘的卡片
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Scoring */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-vale-400 mb-4">計分方式</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>每張場上生物的基礎分數</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>收集同元素生物的套組加分</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>特殊生物的額外加分效果</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>傳說生物的強力能力</span>
              </li>
            </ul>
          </section>

          {/* Start Playing */}
          <div className="text-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/')}
              data-testid="start-playing-btn"
            >
              開始遊戲
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Tutorial
