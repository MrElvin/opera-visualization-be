// 开始
// 获取长度突变阈值
averageLengthDiff = getAverageLengthDiffTotal(paragraphsData) / (paragraphsData.length - 1)
// 获取方差突变的上下阈值
varianceDiffMax = getVarianceDiffTotal(paragraphsData) / (paragraphsData.length - 1)
varianceDiffMin = getAverageVariance(paragraphsData)
// 唱词片段数目
singCount = 0
for (paragraph in paragraphsData)
  if (isNotLastParagraph(paragraph))
    if (Math.abs(paragraph.next.sentenceAverageLength - paragraph.sentenceAverageLength) > averageLengthDiff)
      temp.push(paragraph)
      if (isEmpty(temp)) temp = []
      else if (temp.length > 1)
        for (tempPara in temp)
          if (isNotLastTempParagraph(tempPara)&&tempPara.sentenceVariance<varianceDiffMin
          &&Math.abs(tempPara.sentenceVariance - tempPara.next.sentenceVariance)<varianceDiffMax)
            singCount++
        temp = []
      else
        if (temp[0].sentenceVariance < varianceDiffMin) singCount++
        temp = []
    else temp.push(paragraph)
  else
    if (temp.length > 1)
      for (tempPara in temp)
        if (isNotLastTempParagraph(tempPara) && tempPara.sentenceVariance < varianceDiffMin
          && Math.abs(tempPara.sentenceVariance - tempPara.next.sentenceVariance) < varianceDiffMax)
          singCount++
      temp = []
    else
      if (temp[0].sentenceVariance < varianceDiffMin) singCount++
      temp = []
// 结束
